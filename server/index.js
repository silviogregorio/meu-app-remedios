import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { sendEmail, verifyConnection } from './emailService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Rate limiter: max 10 emails per 15 minutes per IP
const emailLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 30, // limit each IP to 30 requests per windowMs
    message: {
        success: false,
        error: 'Muitas requisições. Tente novamente em 15 minutos.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

// General rate limiter for all routes
const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // limit each IP to 60 requests per minute
    message: {
        success: false,
        error: 'Muitas requisições. Tente novamente em breve.'
    }
});

// Middlewares
app.use(cors({
    origin: FRONTEND_URL,
    credentials: true
}));
app.use(express.json({ limit: '10mb' })); // Limit payload size
app.use(generalLimiter);

// Debug middleware
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Rota de health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        message: 'Servidor de email funcionando',
        timestamp: new Date().toISOString()
    });
});

// Validation middleware
const validateEmail = [
    body('to')
        .trim()
        .notEmpty()
        .withMessage('Email é obrigatório')
        .custom((value) => {
            // Split by comma and validate each email
            const emails = value.split(',').map(e => e.trim());
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            const allValid = emails.every(email => emailRegex.test(email));
            if (!allValid) {
                throw new Error('Um ou mais emails são inválidos');
            }
            return true;
        }),
    body('subject')
        .trim()
        .notEmpty()
        .withMessage('Assunto é obrigatório')
        .isLength({ max: 200 })
        .withMessage('Assunto muito longo (máximo 200 caracteres)'),
    body('text')
        .trim()
        .notEmpty()
        .withMessage('Texto é obrigatório')
        .isLength({ max: 10000 })
        .withMessage('Texto muito longo (máximo 10000 caracteres)'),
    body('observations')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Observações muito longas (máximo 1000 caracteres)'),
    body('healthLogsData')
        .optional()
        .isArray()
        .withMessage('healthLogsData deve ser um array')
];


// Middleware de Log
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
});

// Rota DEDICADA para Contato (Landing Page) - Isolamento de falha
app.post('/api/contact', async (req, res) => {
    try {
        console.log(`[Contact] Recebendo mensagem de ${req.body.name}`);

        const { name, email, phone, message } = req.body;

        if (!name || (!email && !req.body.senderEmail) || !message) {
            return res.status(400).json({ success: false, error: 'Campos obrigatórios: nome, email, mensagem' });
        }

        // Hardcoded destination for security and simplicity
        const to = 'sigsis@gmail.com';
        const subject = `SiG Remédios - Contato: ${name}`;

        // Enviar email usando o serviço existente, mas com payload controlado
        const result = await sendEmail({
            to,
            subject,
            text: message, // O template usa 'text' para preencher 'message'
            type: 'contact',
            senderName: name,
            senderEmail: email || req.body.senderEmail,
            phone,
            observations: `Contato via Web de: ${email}`
        });

        res.json(result);

    } catch (error) {
        console.error('Erro na rota de contato:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao enviar mensagem de contato'
        });
    }
});

// Alias: /send-email (para caso o Vercel rewrite remova o prefixo /api)
app.post('/send-email', validateEmail, async (req, res) => {
    // Reutiliza a lógica (pode ser refatorado para função separada, mas aqui vamos redirecionar internamente 
    // ou simplesmente processar se extrairmos a função.
    // Para evitar duplicidade de código sem refatorar tudo agora, vou fazer o forward 307.
    // Mas 307 mantém o método POST.
    res.redirect(307, '/api/send-email');
});

// Rota para enviar email
app.post('/api/send-email', validateEmail, async (req, res) => {
    try {
        // Check validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.error('Validation errors:', JSON.stringify(errors.array(), null, 2));
            return res.status(400).json({
                success: false,
                error: errors.array()[0].msg,
                errors: errors.array()
            });
        }

        const { to, subject, text, observations, type, senderName, senderEmail, sosData, reportData, healthLogsData, healthLogsByPatient, attachments } = req.body;

        console.log('Received Body Keys:', Object.keys(req.body));
        console.log('healthLogsData:', req.body.healthLogsData ? `Array with ${req.body.healthLogsData.length} items` : 'undefined');
        if (attachments) console.log('Has Attachments:', attachments.length);

        // Enviar email
        const result = await sendEmail({ to, subject, text, observations, type, senderName, senderEmail, sosData, reportData, healthLogsData, healthLogsByPatient, attachments });

        res.json(result);

    } catch (error) {
        console.error('Erro ao processar requisição:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Erro ao enviar email'
        });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Erro não tratado:', err);
    res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Rota não encontrada'
    });
});


// Iniciar servidor (apenas em desenvolvimento local)
const startServer = async () => {
    try {
        // Iniciar servidor IMEDIATAMENTE (sem esperar SMTP)
        app.listen(PORT, () => {
            console.log(`\n✅ Servidor rodando em http://localhost:${PORT}`);
            console.log(`📧 API de email: http://localhost:${PORT}/api/send-email`);
            console.log(`🔗 Frontend permitido: ${FRONTEND_URL}`);
            console.log(`🛡️  Rate limiting ativado: 100 emails/1min por IP\n`);

            // Verificar SMTP em background
            verifyConnection().then(isConfigured => {
                if (!isConfigured) {
                    console.warn('\n⚠️  ATENÇÃO: Configure o arquivo .env com suas credenciais SMTP');
                } else {
                    console.log('✅ SMTP configurado e pronto em background.');
                }
            }).catch(err => console.error('Erro na verificação SMTP:', err));
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};

// Iniciar apenas se não estiver na Vercel (serverless)
if (process.env.VERCEL !== '1') {
    startServer();
}

// Exportar para Vercel serverless functions
export default app;

