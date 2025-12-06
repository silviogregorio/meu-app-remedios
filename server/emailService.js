import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Configurar transporter SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false, // true para 465, false para outras portas
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

// Função para enviar email
export const sendEmail = async ({ to, subject, text, observations, type = 'invite', senderName, senderEmail }) => {
  try {
    // Validar dados obrigatórios
    if (!to || !subject || !text) {
      throw new Error('Campos obrigatórios: to, subject, text');
    }

    // Validar configuração SMTP
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('Configurações SMTP não encontradas. Configure o arquivo .env');
    }

    const transporter = createTransporter();

    // Selecionar Template
    const getTemplate = (type, data) => {
      const year = new Date().getFullYear();

      const styles = `
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border: 1px solid #e5e7eb; }
        .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center; } /* Verde SiG */
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

      if (type === 'contact') {
        const { senderName, senderEmail, message } = data;
        return baseHtml(`
          <div class="header" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);"> <!-- Roxo para Contato -->
            <h1>Nova Mensagem 📬</h1>
          </div>
          <div class="content">
            <div class="welcome-text">Olá, Admin!</div>
            <p>Você recebeu uma nova mensagem através do site SiG Remédios.</p>
            
            <div class="message-box">
              <span class="label">Remetente</span>
              <div class="value" style="margin-bottom: 12px;">${senderName} (${senderEmail})</div>
              
              <span class="label">Mensagem</span>
              <div class="value">${message.replace(/\n/g, '<br>')}</div>
            </div>
          </div>
        `);
      }

      // Default: Sharing/Invite
      return baseHtml(`
        <div class="header">
          <h1>SiG Remédios 💊</h1>
        </div>
        <div class="content">
          <div class="welcome-text">Olá!</div>
          <p>${data.text.replace(/\n/g, '<br>')}</p>
          
          ${data.observations ? `
          <div class="message-box">
            <strong>📝 Informação Adicional:</strong><br/>
            ${data.observations}
          </div>
          ` : ''}

          <div class="cta-container">
            <a href="http://localhost:3000" class="button">Acessar Sistema</a>
          </div>
        </div>
      `);
    };

    const htmlTemplate = getTemplate(type, {
      text,
      observations,
      senderName: senderName || 'Visitante',
      senderEmail: senderEmail || 'Não informado',
      message: text
    });

    // Configurar email
    const mailOptions = {
      from: `"Sistema de Controle de Medicamentos" <${process.env.SMTP_USER}>`,
      to: to,
      subject: subject,
      html: htmlTemplate, // Usar HTML em vez de texto plano
      text: `${text}\n\n${observations || ''}\n\nAcesse: http://localhost:3000` // Fallback para clientes sem HTML
    };

    // Enviar email
    const info = await transporter.sendMail(mailOptions);


    console.log('Email enviado com sucesso:', info.messageId);
    return {
      success: true,
      messageId: info.messageId,
      message: 'Email enviado com sucesso'
    };

  } catch (error) {
    console.error('Erro ao enviar email:', error);

    // Tratar erro específico do Gmail (Senha de App requerida)
    if (error.response && error.response.includes('534') && error.response.includes('5.7.9')) {
      throw new Error('É necessário usar Senha de App no Gmail (Erro 534). Veja as instruções no passo-a-passo.');
    }

    throw error;
  }
};

// Função para verificar configuração
export const verifyConnection = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Servidor SMTP configurado corretamente');
    return true;
  } catch (error) {
    console.error('❌ Erro na configuração SMTP:', error.message);
    return false;
  }
};
