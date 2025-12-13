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
      // Exception: Allow Public Contact Form
      if (type === 'contact' || type === 'support') {
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
      const { age, phone, city } = request.body.senderDetails || {};

      htmlContent = `
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e1e4e8;">
                    
                    <!-- Header colorido -->
                    <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 30px 20px; text-align: center; color: white;">
                        <h2 style="margin: 0; font-size: 24px;">📬 Nova Solicitação de Suporte</h2>
                        <p style="margin: 10px 0 0; opacity: 0.9;">Alguém precisa de ajuda no app!</p>
                    </div>

                    <div style="padding: 30px;">
                        
                        <!-- Dados do Usuário Card -->
                        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; border-left: 4px solid #6366f1; margin-bottom: 25px;">
                            <h3 style="margin-top: 0; color: #475569; font-size: 16px;">👤 Quem enviou:</h3>
                            <p style="margin: 5px 0; font-size: 16px; font-weight: bold; color: #1e293b;">${senderName}</p>
                            <p style="margin: 0; color: #64748b; font-size: 14px;">${senderEmail}</p>

                            <!-- Detalhes Extras (Idade, Telefone, Cidade) -->
                            <div style="margin-top: 15px; display: flex; flex-wrap: wrap; gap: 15px; font-size: 14px; color: #334155;">
                                ${age ? `<span style="background: #e0e7ff; color: #4338ca; padding: 4px 10px; border-radius: 20px;">🎂 ${age} anos</span>` : ''}
                                ${phone ? (() => {
          const cleanPhone = phone.replace(/\D/g, ''); // Remove tudo que não é número
          const waLink = `https://wa.me/55${cleanPhone}`; // Assume Brasil +55 se não tiver
          return `<a href="${waLink}" target="_blank" style="text-decoration: none;"><span style="background: #dcfce7; color: #15803d; padding: 4px 10px; border-radius: 20px; cursor: pointer;">📱 ${phone} (Zap)</span></a>`;
        })() : ''}
                                ${city ? `<span style="background: #ffedd5; color: #c2410c; padding: 4px 10px; border-radius: 20px;">📍 ${city}</span>` : ''}
                            </div>
                            
                            <!-- Compartilhamentos (Novo) -->
                            ${request.body.senderDetails?.shares ? `
                            <div style="margin-top: 20px; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                                <h4 style="margin: 0 0 10px; font-size: 14px; color: #475569;">🤝 Compartilhamentos Ativos:</h4>
                                <div style="font-size: 13px; color: #64748b;">
                                    ${request.body.senderDetails.shares.map(item => `
                                        <div style="margin-bottom: 8px;">
                                            <strong>${item.patientName}:</strong>
                                            <ul style="margin: 5px 0 0; padding-left: 20px;">
                                                ${item.shares.map(s => `<li>${s}</li>`).join('')}
                                            </ul>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            ` : ''}
                        </div>

                        <!-- Assunto -->
                        <div style="margin-bottom: 20px;">
                            <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px;">Assunto</span>
                            <h3 style="margin: 5px 0; color: #0f172a;">${subject}</h3>
                        </div>

                        <!-- Mensagem Corpo -->
                        <div style="margin-bottom: 30px;">
                            <span style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #94a3b8; letter-spacing: 1px;">Mensagem</span>
                            <div style="background: #ffffff; padding: 15px; border: 1px solid #cbd5e1; border-radius: 8px; color: #334155; line-height: 1.6; margin-top: 5px;">
                                ${text.replace(/\n/g, '<br>')}
                            </div>
                        </div>

                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                         Enviado via SiG Remédios App • ${new Date().toLocaleString('pt-BR')}
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
                <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.05); border: 1px solid #e1e4e8;">
                    
                    <!-- Header -->
                    <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; color: white;">
                        <h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">SiG Remédios</h1>
                        <p style="margin: 10px 0 0; opacity: 0.9; font-size: 16px;">Convite de Acesso Compartilhado</p>
                    </div>

                    <div style="padding: 40px 30px; color: #334155; line-height: 1.6;">
                        <div style="margin-bottom: 25px;">
                            <h2 style="color: #1e293b; font-size: 22px; margin-top: 0;">Você recebeu um acesso! 🔑</h2>
                            <p style="font-size: 16px; margin-bottom: 20px;">${text.replace(/\n/g, '<br>')}</p>
                        </div>

                        ${observations ? `
                        <div style="background-color: #f0fdfa; border-left: 4px solid #10b981; padding: 20px; border-radius: 8px; margin-bottom: 30px;">
                            <strong style="color: #0f766e; display: block; margin-bottom: 5px; font-size: 13px; text-transform: uppercase; letter-spacing: 0.5px;">Observações</strong>
                            <span style="color: #334155;">${observations}</span>
                        </div>
                        ` : ''}

                        <div style="text-align: center; margin: 35px 0;">
                            <a href="${appUrl}" style="display: inline-block; background-color: #10b981; color: white; font-weight: bold; text-decoration: none; padding: 16px 32px; border-radius: 50px; font-size: 16px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3); transition: all 0.2s;">
                                Acessar Aplicativo Agora
                            </a>
                        </div>
                        
                        <p style="font-size: 14px; color: #64748b; text-align: center;">
                            Se você não reconhece este convite, pode ignorar este email.
                        </p>
                    </div>

                    <!-- Footer -->
                    <div style="background-color: #f8fafc; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
                         © ${new Date().getFullYear()} SiG Remédios • Saúde em suas mãos
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
