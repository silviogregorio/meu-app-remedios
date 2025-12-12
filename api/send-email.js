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
    const { to, subject, text, observations, senderName, senderEmail, type, attachments } = request.body;
    // ... validation ...
    // ...
    const mailOptions = {
      from: `"SiG Remédios" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: htmlContent,
      text: `${text}\n\n${observations || ''}\n\nAcesse: ${appUrl}`,
      attachments // Add attachments support
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
