import nodemailer from 'nodemailer';

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
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method !== 'POST') {
    return response.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { to, subject, text, observations, senderName, senderEmail, type } = request.body;

    if (!to || !subject || !text) {
      return response.status(400).json({ error: 'Campos obrigatórios: to, subject, text' });
    }

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.error('SMTP credentials missing');
      return response.status(500).json({ error: 'Configuração de email não encontrada no servidor.' });
    }

    const transporter = createTransporter();

    // --- Template Generator ---
    const year = new Date().getFullYear();
    // Use production URL or fallback
    const appUrl = process.env.VITE_FRONTEND_URL || 'https://sigremedios-novo.vercel.app';

    const styles = `
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; }
            .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px; }
            .content { padding: 40px 32px; color: #334155; line-height: 1.6; font-size: 16px; }
            .welcome-text { margin-bottom: 24px; font-size: 18px; color: #1e293b; font-weight: 600; }
            .message-box { background-color: #f8fafc; border-left: 4px solid #10b981; padding: 20px; margin: 24px 0; border-radius: 0 8px 8px 0; color: #475569; }
            .label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; font-weight: 600; margin-bottom: 4px; display: block; }
            .value { color: #1e293b; font-weight: 500; }
            .cta-container { text-align: center; margin-top: 32px; margin-bottom: 16px; }
            .button { display: inline-block; background-color: #10b981; color: #ffffff !important; padding: 14px 32px; border-radius: 12px; text-decoration: none; font-weight: 600; font-size: 16px; transition: background-color 0.2s; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2); }
            .button:hover { background-color: #059669; }
            .footer { background-color: #f8fafc; padding: 24px; text-align: center; color: #94a3b8; font-size: 13px; border-top: 1px solid #e2e8f0; }
        `;

    const baseHtml = (content) => `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <style>${styles}</style>
            </head>
            <body>
              <div class="container">
                ${content}
                <div class="footer">
                  <p>Este é um email automático do SiG Remédios.</p>
                  <p>© ${year} SiG Remédios. Todos os direitos reservados.</p>
                </div>
              </div>
            </body>
            </html>
        `;

    let htmlContent;

    if (type === 'contact') {
      htmlContent = baseHtml(`
               <div class="header" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
                 <h1>Nova Mensagem 📬</h1>
               </div>
               <div class="content">
                 <div class="welcome-text">Olá, Admin!</div>
                 <p>Você recebeu uma nova mensagem através do site SiG Remédios.</p>
                 
                 <div class="message-box">
                   <span class="label">Remetente</span>
                   <div class="value" style="margin-bottom: 12px;">${senderName || 'Anônimo'} (${senderEmail || 'N/A'})</div>
                   
                   <span class="label">Mensagem</span>
                   <div class="value">${text.replace(/\n/g, '<br>')}</div>
                 </div>
               </div>
             `);
    } else if (type === 'stock_alert') {
      htmlContent = baseHtml(`
                <div class="header" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);">
                  <h1>Estoque Crítico ⚠️</h1>
                </div>
                <div class="content">
                  <div class="welcome-text">Atenção, Usuário!</div>
                  <p>O estoque de um dos seus medicamentos está acabando.</p>
                  
                  <div class="message-box" style="border-left-color: #f59e0b;">
                    <span class="label">Medicamento</span>
                    <div class="value" style="font-size: 20px; color: #b45309;">${subject.replace('⚠️ Alerta de Estoque: ', '')}</div>
                    <div style="margin-top: 10px; color: #475569;">
                        ${text.replace(/\n/g, '<br>')}
                    </div>
                  </div>

                  <div class="cta-container">
                    <a href="${appUrl}" class="button" style="background-color: #f59e0b; box-shadow: 0 4px 6px -1px rgba(245, 158, 11, 0.3);">
                        Verificar Estoque
                    </a>
                  </div>
                </div>
              `);
    } else {
      // Default: Invite/Share
      htmlContent = baseHtml(`
                <div class="header">
                  <h1>SiG Remédios 💊</h1>
                </div>
                <div class="content">
                  <div class="welcome-text">Convite de Acesso</div>
                  <p>${text.replace(/\n/g, '<br>')}</p>
                  
                  ${observations ? `
                  <div class="message-box">
                    <span class="label">Informações Adicionais</span>
                    <div class="value">${observations}</div>
                  </div>
                  ` : ''}

                  <div class="cta-container">
                    <a href="${appUrl}" class="button">Acessar Sistema</a>
                  </div>
                </div>
              `);
    }
    // --- End Template Generator ---

    const mailOptions = {
      from: `"SiG Remédios" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
      text: `${text}\n\n${observations || ''}\n\nAcesse: ${appUrl}`
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.messageId);

    return response.status(200).json({ success: true, messageId: info.messageId });

  } catch (error) {
    console.error('Error sending email:', error);

    // Tratar erro específico do Gmail (Senha de App requerida)
    if (error.response && error.response.includes('534') && error.response.includes('5.7.9')) {
      return response.status(500).json({ error: 'Erro de Autenticação Gmail: É necessário usar uma "Senha de App" e não sua senha normal. Gere uma em myaccount.google.com > Segurança > Senhas de App.' });
    }

    return response.status(500).json({ error: error.message || 'Falha ao enviar email' });
  }
}
