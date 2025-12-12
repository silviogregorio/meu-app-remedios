import nodemailer from 'nodemailer';
import { createClient } from '@supabase/supabase-js';

// Init Supabase checking (using publicly safe Anon Key for getUser check)
const supabaseUrl = 'https://ahjywlsnmmkavgtkvpod.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoanl3bHNubW1rYXZndGt2cG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTU1NzIsImV4cCI6MjA4MDA5MTU3Mn0.jBnLg-LxGDoSTxiSvRVaSgQZDbr0h91Uxm2S7YBcMto';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configurar transporter SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

export default async function handler(request, response) {
  // Handling CORS
  response.setHeader('Access-Control-Allow-Credentials', true);
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { to, subject, text, observations, senderName, senderEmail, type, attachments } = request.body;

    // --- SECURITY CHECK ---
    const authHeader = request.headers.authorization;
    let isAuthenticated = false;

    // 1. Verify Token if present
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      if (token) {
        const { data: { user }, error } = await supabase.auth.getUser(token);
        if (user) isAuthenticated = true;
      }
    }

    // 2. Enforce Permissions
    if (!isAuthenticated) {
      // Exception: Allow Public Contact Form ONLY to Admin Email
      const isAdminEmail = to === 'sigsis@gmail.com' || to === process.env.SMTP_USER;
      if (type === 'contact' && isAdminEmail) {
        // Allowed (Public Form)
      } else {
        return response.status(401).json({ error: 'Unauthorized: Invalid or missing token.' });
      }
    }
    // -----------------------

    if (!to || !subject || !text) {
      return response.status(400).json({ error: 'Missing required fields' });
    }

    const transporter = createTransporter();

    const appUrl = 'https://sigremedios.vercel.app';
    let htmlContent = '';

    if (type === 'contact') {
      htmlContent = `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>Nova Mensagem de Contato</h2>
                    <p><strong>De:</strong> ${senderName} (${senderEmail})</p>
                    <p><strong>Assunto:</strong> ${subject}</p>
                    <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        ${text.replace(/\n/g, '<br>')}
                    </div>
                </div>
            `;
    } else if (type === 'alert') {
      // ... existing alert template ...
      htmlContent = `
                <div style="font-family: sans-serif; padding: 20px; color: #333; background-color: #fff1f2; border: 1px solid #fecdd3; border-radius: 8px;">
                    <h2 style="color: #9f1239;">🚨 Alerta de Medicamento</h2>
                    <p style="font-size: 16px;">${text.replace(/\n/g, '<br>')}</p>
                    <p style="margin-top: 20px; font-size: 14px; color: #666;">Enviado automaticamente pelo SiG Remédios em ${new Date().toLocaleString('pt-BR')}</p>
                    <a href="${appUrl}" style="display: inline-block; margin-top: 15px; padding: 10px 20px; background-color: #e11d48; color: white; text-decoration: none; border-radius: 5px;">Abrir Aplicativo</a>
                </div>
             `;
    } else if (type === 'invite') {
      htmlContent = `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>Convite de Acesso - SiG Remédios</h2>
                    <p>${text.replace(/\n/g, '<br>')}</p>
                    ${observations ? `<p><strong>Obs:</strong> ${observations}</p>` : ''}
                    <div style="margin-top: 20px;">
                        <a href="${appUrl}" style="padding: 10px 20px; bg: #0f766e; color: white; text-decoration: none; border-radius: 5px;">Acesse Agora</a>
                    </div>
                </div>
            `;
    } else {
      // Default / Report
      htmlContent = `
                <div style="font-family: sans-serif; padding: 20px; color: #333;">
                    <h2>${subject}</h2>
                    <p>${text.replace(/\n/g, '<br>')}</p>
                    ${observations ? `<p><strong>Observações:</strong> ${observations}</p>` : ''}
                    
                    ${attachments && attachments.length > 0 ?
          '<p style="background: #f0fdfa; color: #0f766e; padding: 10px; border-radius: 6px; display: inline-block;">📎 Este email contém um anexo (PDF).</p>'
          : ''}

                    <div style="margin-top: 30px; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 10px;">
                        Enviado via SiG Remédios
                    </div>
                </div>
            `;
    }

    const mailOptions = {
      from: `"SiG Remédios" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
      text: `${text}\n\n${observations || ''}\n\nAcesse: ${appUrl}`,
      attachments
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    return response.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error('Error sending email:', error);

    if (error.response && error.response.includes('534') && error.response.includes('5.7.9')) {
      return response.status(500).json({ error: 'Erro de Autenticação Gmail: Use Senha de App.' });
    }

    return response.status(500).json({ error: error.message || 'Falha ao enviar email' });
  }
}
