
import nodemailer from 'nodemailer';

// Utilitário para lidar com CORS
const allowCors = (fn) => async (req, res) => {
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Strict Origin Check
    // Adicione aqui todos os domínios que podem acessar sua API.
    // Em produção, deve conter apenas 'https://sigremedios.vercel.app'
    const allowedOrigins = ['https://sigremedios.vercel.app', 'http://localhost:5173', 'http://localhost:3000'];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    // Se não estiver na whitelist, o browser bloqueará a leitura da resposta por padrão.

    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS'); // Apenas POST é necessário para enviar email
    res.setHeader(
        'Access-Control-Allow-Headers',
        'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
    );
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    return await fn(req, res);
};

const sendEmail = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { to, subject, text, observations, type = 'invite', senderName, senderEmail } = req.body;

        if (!to || !subject || !text) {
            return res.status(400).json({ error: 'Campos obrigatórios ausentes.' });
        }

        const host = (process.env.SMTP_HOST || 'smtp.gmail.com').trim();
        const user = (process.env.SMTP_USER || '').trim();
        const pass = (process.env.SMTP_PASS || '').trim();

        if (!user || !pass) {
            // Log interno detalhado, mas erro genérico para o usuário
            console.error('Configuração SMTP ausente.');
            throw new Error('Erro de configuração no servidor.');
        }

        const transporter = nodemailer.createTransport({
            host: host,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: false, // true para 465, false para outras portas
            auth: {
                user: user,
                pass: pass
            }
        });

        // Template Generator
        const getTemplate = (type, data) => {
            const year = new Date().getFullYear();

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

            if (type === 'contact') {
                const { senderName, senderEmail, message } = data;
                return baseHtml(`
                    <div class="header" style="background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);">
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
                    <a href="https://sigremedios.vercel.app" class="button">Acessar Sistema</a>
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

        await transporter.sendMail({
            from: `"SiG Remédios" <${user}>`,
            to,
            subject,
            html: htmlTemplate,
            text
        });

        res.status(200).json({ success: true, message: 'Email enviado com sucesso.' });

    } catch (error) {
        // LOG INTERNO: Aqui vai o erro completo para debug no painel da Vercel
        console.error('E-MAIL API ERROR (INTERNAL):', {
            message: error.message,
            stack: error.stack,
            code: error.code,
            command: error.command
        });

        // RESPOSTA CLIENTE: Genérica e sanitizada
        res.status(500).json({
            error: 'Não foi possível enviar o email no momento. Tente novamente mais tarde.',
            ref: new Date().getTime() // Referência segura para suporte se necessário
        });
    }
};

export default allowCors(sendEmail);
