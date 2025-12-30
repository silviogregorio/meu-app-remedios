import './loadEnv.js';
import express from 'express';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { sendEmail, verifyConnection } from './emailService.js';
import { initFirebaseAdmin, sendPushNotification } from './firebaseAdmin.js';
import { createClient } from '@supabase/supabase-js';

import { startWeeklyReportCron } from './weeklyReportCron.js';
import { startReminderCron } from './reminderCron.js';
import { startStockCron } from './stockCron.js';

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

// Security Headers Middleware
app.use((req, res, next) => {
    // Content Security Policy (Simplified for API but allowing QR API for consistency if needed)
    res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com; img-src 'self' data: https://*.googleusercontent.com; object-src 'none';");
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

// Middleware de Verificação de JWT (Supabase)
const verifyJWT = async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.warn(`[Auth] Acesso negado: Token ausente em ${req.url}`);
        return res.status(401).json({ success: false, error: 'Acesso negado: Token não fornecido' });
    }

    const token = authHeader.split(' ')[1];
    try {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error('Configuração do Supabase ausente no servidor');
        }

        const supabase = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.warn(`[Auth] Token inválido em ${req.url}:`, error?.message);
            return res.status(401).json({ success: false, error: 'Sessão inválida ou expirada' });
        }

        // Anexar usuário à requisição para uso posterior
        req.user = user;
        next();
    } catch (error) {
        console.error('[Auth] Erro na verificação do token:', error);
        res.status(500).json({ success: false, error: 'Erro interno na verificação de identidade' });
    }
};

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

// Rate limiter específico para contato (mais restritivo)
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5, // limit each IP to 5 contact requests per hour
    message: {
        success: false,
        error: 'Muitas mensagens enviadas. Tente novamente em 1 hora.'
    }
});

// Rota DEDICADA para Contato (Landing Page) - COM PROTEÇÃO ANTI-BOT
app.post('/api/contact', contactLimiter, async (req, res) => {
    try {
        const { name, email, phone, message, website, formLoadTime } = req.body;

        // PROTEÇÃO 1: Honeypot field (bots fill this, humans don't see it)
        if (website && website.trim() !== '') {
            console.warn('[Contact] Bot detected via honeypot:', req.ip);
            // Return success to not reveal detection, but don't send email
            return res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
        }

        // PROTEÇÃO 2: Time-based check (form must be open for at least 3 seconds)
        if (formLoadTime) {
            const elapsed = Date.now() - parseInt(formLoadTime);
            if (elapsed < 3000) { // Less than 3 seconds
                console.warn('[Contact] Bot detected via timing:', req.ip, elapsed + 'ms');
                return res.json({ success: true, message: 'Mensagem enviada com sucesso!' });
            }
        }

        // PROTEÇÃO 3: Basic validation
        if (!name || name.length < 2 || name.length > 100) {
            return res.status(400).json({ success: false, error: 'Nome inválido' });
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return res.status(400).json({ success: false, error: 'Email inválido' });
        }
        if (!message || message.length < 10 || message.length > 2000) {
            return res.status(400).json({ success: false, error: 'Mensagem deve ter entre 10 e 2000 caracteres' });
        }

        console.log(`[Contact] Recebendo mensagem de ${name}`);

        // Hardcoded destination for security and simplicity
        const to = 'sigsis@gmail.com';
        const subject = `SiG Remédios - Contato: ${name}`;

        // Enviar email usando o serviço existente, mas com payload controlado
        const result = await sendEmail({
            to,
            subject,
            text: message,
            type: 'contact',
            senderName: name,
            senderEmail: email,
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

// Rota para enviar email (Protegida)
app.post('/api/send-email', verifyJWT, validateEmail, async (req, res) => {
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

        const { to, subject, text, observations, type, senderName, senderEmail, sosData, reportData, weeklyData, lowStockData, healthLogsData, healthLogsByPatient, attachments, tokens } = req.body;

        console.log('Received Body Keys:', Object.keys(req.body));
        console.log('healthLogsData:', req.body.healthLogsData ? `Array with ${req.body.healthLogsData.length} items` : 'undefined');
        if (attachments) console.log('Has Attachments:', attachments.length);

        // Enriquecer dados de SOS com Geocoding Reverso (se houver lat/lng)
        if (type === 'sos' && sosData && sosData.lat && sosData.lng) {
            try {
                console.log(`[SOS] Buscando endereço para ${sosData.lat}, ${sosData.lng}...`);
                const geoResponse = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${sosData.lat}&lon=${sosData.lng}`, {
                    headers: { 'User-Agent': 'SiG-Remedios-App' }
                });
                if (geoResponse.ok) {
                    const geoData = await geoResponse.json();
                    sosData.address = geoData.display_name;
                    console.log(`[SOS] Endereço encontrado: ${sosData.address}`);
                }
            } catch (geoErr) {
                console.error('[SOS] Erro no geocoding reverso:', geoErr);
            }
        }

        // Enviar email
        try {
            const result = await sendEmail({ to, subject, text, observations, type, senderName, senderEmail, sosData, reportData, weeklyData, lowStockData, healthLogsData, healthLogsByPatient, attachments });

            // Enviar Push (Opcional ou Automático para SOS)
            let targetTokens = tokens || [];

            if (type === 'sos' && to && targetTokens.length === 0) {
                try {
                    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
                    const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
                    const authHeader = req.headers.authorization;

                    if (authHeader && supabaseUrl && supabaseAnonKey) {
                        const supabaseServer = createClient(supabaseUrl, supabaseAnonKey, {
                            global: { headers: { Authorization: authHeader } }
                        });
                        const emails = to.split(',').map(e => e.trim());
                        const { data: rpcTokens, error } = await supabaseServer.rpc('get_tokens_by_emails', { p_emails: emails });
                        if (!error && rpcTokens) targetTokens = rpcTokens.map(t => t.token);
                    }
                } catch (err) {
                    console.error('Erro ao buscar tokens via RPC:', err);
                }
            }

            if (targetTokens.length > 0) {
                try {
                    await sendPushNotification(targetTokens, subject, text, { type, ...sosData });
                } catch (pushErr) {
                    console.error('Falha ao enviar push:', pushErr);
                }
            }

            res.json(result);
        } catch (sendErr) {
            console.error('CRITICAL: Error in sendEmail call:', sendErr);
            throw sendErr; // rethrow to be caught by the outer catch
        }

    } catch (error) {
        console.error('❌ [API] Erro ao processar requisição de email:', {
            message: error.message,
            stack: error.stack,
            type: req.body?.type,
            to: req.body?.to
        });
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

            // Inicializar Firebase Admin
            initFirebaseAdmin().catch(err => console.error('Erro ao inicializar Firebase Admin:', err));

            // Iniciar Cron Job de Resumo Semanal
            startWeeklyReportCron();
            console.log('📅 Cron job de resumo semanal ativado (Segunda 9h)');

            // Iniciar Cron Job de Lembrete "Você tomou?"
            startReminderCron();
            console.log('🔔 Cron job de lembrete "Você tomou?" ativado');

            // Iniciar Cron Job de Estoque Baixo
            startStockCron();
            console.log('📦 Cron job de estoque ativado');
        });

    } catch (error) {
        console.error('❌ CRITICAL ERROR IN startServer:', error);
        // More detailed log
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ PORT ${PORT} IS ALREADY IN USE!`);
        }
        process.exit(1);
    }
};

// Inicializar Supabase Admin (Necessário Service Role para ouvir todas as tabelas)
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️  Supabase URL ou Service Key não encontrados no .env. Algumas funções (como SOS) podem falhar.');
}

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;

const handleSOSInsert = async (payload) => {
    console.log('🚨 [BACKEND] ===== NOVO SOS DETECTADO =====');
    const alert = payload.new;

    try {
        // 1. Buscar Paciente
        const { data: patient, error: patientError } = await supabaseAdmin.from('patients').select('*').eq('id', alert.patient_id).single();
        if (patientError) console.error('❌ [BACKEND] Erro ao buscar paciente:', patientError);

        // 2. Buscar Usuário que disparou (com dados de endereço)
        const { data: userProfile, error: profileError } = await supabaseAdmin.from('profiles').select('*').eq('id', alert.triggered_by).single();
        if (profileError) console.error('❌ [BACKEND] Erro ao buscar profile:', profileError);

        console.log('👤 [BACKEND] User Profile fetched:', userProfile ? `Found (ID: ${userProfile.id})` : 'Not Found');

        let userPhone = userProfile?.phone;
        if (!userPhone) {
            console.log('⚠️ [BACKEND] Phone not found in profile. Checking Supabase Auth...');
            try {
                const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(alert.triggered_by);
                if (authUser && authUser.user) {
                    userPhone = authUser.user.phone || authUser.user.user_metadata?.phone || authUser.user.user_metadata?.whatsapp;
                    console.log('👤 [BACKEND] Phone found in Auth:', userPhone);
                }
            } catch (e) { console.error('Error fetching auth user:', e); }
        }
        console.log('📞 [BACKEND] Final User Phone:', userPhone || 'N/A');

        // 3. Buscar Prescrições e Medicamentos do Paciente
        const { data: prescriptions } = await supabaseAdmin
            .from('prescriptions')
            .select('*, medications(*)')
            .eq('patient_id', alert.patient_id)
            .eq('active', true);

        const medicationsList = prescriptions?.map(p => {
            const med = p.medications;
            return `${med?.name || 'Medicamento'} (${p.dose_amount || ''} ${med?.unit || ''}) - ${p.frequency || ''}`;
        }).filter(Boolean) || [];

        const medicationsText = medicationsList.length > 0
            ? medicationsList.join('<br>')
            : 'Nenhum medicamento ativo registrado.';

        // 4. Montar lista de contatos de emergência
        const contactList = [];
        if (patient?.emergency_contact_name || patient?.emergency_contact_phone) {
            contactList.push({
                name: patient.emergency_contact_name || 'Contato do Paciente',
                phone: patient.emergency_contact_phone || 'Não informado',
                email: patient.emergency_contact_email
            });
        }
        if (userProfile?.emergency_contact_name || userProfile?.emergency_contact_phone) {
            if (userProfile.emergency_contact_phone !== patient?.emergency_contact_phone) {
                contactList.push({
                    name: userProfile.emergency_contact_name || 'Contato do Usuário',
                    phone: userProfile.emergency_contact_phone || 'Não informado',
                    email: userProfile.emergency_contact_email
                });
            }
        }

        // 5. Buscar Email - com fallback
        let userEmail = userProfile?.email || userProfile?.emergency_contact_email || patient?.email || 'sigsis@gmail.com';

        // 6. Montar lista de destinatários
        const recipients = [userEmail];
        const { data: shares } = await supabaseAdmin.from('patient_shares').select('shared_with_email').eq('patient_id', patient?.id).eq('status', 'accepted');
        if (shares) shares.forEach(s => recipients.push(s.shared_with_email));
        if (patient?.emergency_contact_email) recipients.push(patient.emergency_contact_email);
        if (userProfile?.emergency_contact_email) recipients.push(userProfile.emergency_contact_email);

        const uniqueRecipients = [...new Set(recipients.filter(e => e && e.includes('@')))];
        console.log(`📨 [BACKEND] Enviando SOS para ${uniqueRecipients.length} destinatários`);

        // ENDEREÇO - PRIORIDADE:
        // 1. Usar address do alert (passado pelo frontend quando usa profile-address)
        // 2. Montar do profile do usuário
        // 3. NÃO fazer geocoding reverso (Nominatim erra muito)
        let displayAddress = null;
        let locationUrl = null;

        if (alert.location_lat && alert.location_lng) {
            locationUrl = `https://www.google.com/maps?q=${alert.location_lat},${alert.location_lng}`;
        }

        // Usar endereço passado pelo frontend (MAIS CONFIÁVEL)
        if (alert.address) {
            displayAddress = alert.address;
            console.log(`📍 [BACKEND] Usando endereço do frontend: ${displayAddress}`);
        } else if (userProfile?.street && userProfile?.city && userProfile?.state) {
            // Fallback: montar do profile
            displayAddress = `${userProfile.street}, ${userProfile.number || ''} - ${userProfile.neighborhood || ''}, ${userProfile.city} - ${userProfile.state}`;
            console.log(`📍 [BACKEND] Usando endereço do profile: ${displayAddress}`);
        } else {
            console.log(`📍 [BACKEND] Endereço não disponível`);
        }

        // TEXTOS
        const isHelpRequest = alert.alert_type === 'help_request';
        const subject = isHelpRequest
            ? `💡 PEDIDO DE AJUDA: ${patient?.name || 'Alerta'}`
            : `🚨 EMERGÊNCIA SOS: ${patient?.name || 'Alerta'}`;

        // Título simplificado para o push notification
        const pushTitle = isHelpRequest ? `💡 PEDIDO DE AJUDA` : `🚨 EMERGÊNCIA SOS`;

        const locationText = displayAddress
            ? `${displayAddress}\n(Ver no mapa: ${locationUrl || 'Coordenadas indisponíveis'})`
            : locationUrl || 'Localização não disponível';

        const text = isHelpRequest
            ? `PEDIDO DE AJUDA DO APP\n\nPaciente: ${patient?.name}\n\nO paciente solicitou assistência com o uso do aplicativo.\n\nLocalização: ${locationText}`
            : `ALERTA DE PÂNICO!\n\nPaciente: ${patient?.name}\nMedicamentos: ${medicationsList.join(', ') || 'N/A'}\nContato Emergência: ${patient?.emergency_contact_name || 'N/A'} (${patient?.emergency_contact_phone || 'N/A'})\n\nLocalização: ${locationText}\nPrecisão: ${Math.round(alert.accuracy || 0)}m`;

        // ENVIAR EMAILS com dados completos
        for (const to of uniqueRecipients) {
            try {
                await sendEmail({
                    to,
                    subject,
                    text,
                    type: 'sos',
                    sosData: {
                        patientName: patient?.name || 'Paciente',
                        locationUrl: locationUrl,
                        address: displayAddress, // NEW: pass address to email template
                        locationAccuracy: alert.accuracy,
                        triggeredBy: userProfile?.full_name || 'Usuário',
                        bloodType: patient?.blood_type || 'Não informado',
                        allergies: patient?.allergies || 'Não informado',
                        conditions: patient?.conditions || 'Não informado',
                        medications: medicationsText,
                        contacts: contactList,
                        patientPhone: patient?.phone || '',
                        patientEmail: patient?.email || ''
                    }
                });
                console.log(`✅ [BACKEND] Email SOS enviado para ${to}`);
            } catch (emailErr) {
                console.error(`❌ [BACKEND] Falha ao enviar email para ${to}:`, emailErr.message);
            }
        }

        // ENVIAR PUSH
        const userIds = [patient?.user_id, alert.triggered_by].filter(Boolean);
        const { data: tokens } = await supabaseAdmin.from('fcm_tokens').select('token, user_id').in('user_id', userIds);

        if (tokens && tokens.length > 0) {
            const pushTokens = tokens.map(t => t.token);
            const fcmTokens = tokens.map(t => t.token);
            // ENVIAR PUSH NOTIFICATION
            // Obter telefone: Prioridade para userPhone (busca robusta acima)
            // Se não tiver, tenta contato de emergência
            const phoneForWhatsapp = userPhone || patient?.emergency_contact_phone || '';

            // Formatar telefone para exibição: (11) 99999-9999
            let formattedPhone = phoneForWhatsapp;
            let digits = phoneForWhatsapp.replace(/\D/g, '');

            // Remover 55 se tiver (para formatar bonito)
            let displayDigits = digits;
            if (displayDigits.startsWith('55') && displayDigits.length >= 12) {
                displayDigits = displayDigits.substring(2);
            }

            if (displayDigits.length === 11) {
                formattedPhone = `(${displayDigits.substring(0, 2)}) ${displayDigits.substring(2, 7)}-${displayDigits.substring(7)}`;
            } else if (displayDigits.length === 10) {
                formattedPhone = `(${displayDigits.substring(0, 2)}) ${displayDigits.substring(2, 6)}-${displayDigits.substring(6)}`;
            }

            // CALCULAR IDADE DETALHADA
            let ageText = '';
            if (patient?.birth_date) {
                const birth = new Date(patient.birth_date);
                const today = new Date();

                let years = today.getFullYear() - birth.getFullYear();
                let months = today.getMonth() - birth.getMonth();
                let days = today.getDate() - birth.getDate();

                // Adjust for negative days (borrow from previous month)
                if (days < 0) {
                    months--;
                    // Get days in previous month
                    const prevMonth = new Date(today.getFullYear(), today.getMonth(), 0);
                    days += prevMonth.getDate();
                }

                // Adjust for negative months (borrow from year)
                if (months < 0) {
                    years--;
                    months += 12;
                }

                // Edge case: if months hits 12 due to weird math (unlikely but safe to check)
                if (months === 12) {
                    years++;
                    months = 0;
                }

                ageText = `${years} anos e ${months} meses`;
            }

            const bloodType = patient?.blood_type || '?';
            const medInfo = `[${ageText || 'Idade N/A'} | Sangue: ${bloodType}]`;

            // Formatar texto para o Push Body
            const pushPhoneText = phoneForWhatsapp ? `\n📞 Tel: ${formattedPhone}` : '';
            const patientNameText = patient?.name || 'Alguém';
            const pushActionText = isHelpRequest ? 'precisa de ajuda com o aplicativo.' : 'PRECISA DE AJUDA URGENTE!';
            const pushBody = `${patientNameText}\n${isHelpRequest ? '' : medInfo + '\n'}${pushActionText}${pushPhoneText}\n📍 ${displayAddress || 'Ver localização'}\n\n👆 Clique aqui para abrir o Mapa`;

            try {
                console.log(`📱 [BACKEND] Tentando push para ${fcmTokens.length} token(s)`);

                const whatsappText = isHelpRequest
                    ? `Olá, sou ${patient?.name || 'o paciente'}.\n_*Estou com dificuldade no aplicativo e preciso de uma ajudinha.*_\n\n*Minha localização:*\n${locationUrl || 'https://sigremedios.vercel.app'}`
                    : `Olá, sou ${patient?.name || 'o paciente'}.\n_*PRECISO DE AJUDA URGENTE!*_\n\nIdade: ${ageText || 'N/A'}\nTipo Sanguíneo: *${bloodType}*\nTelefone: ${formattedPhone}\n\n*Minha localização:*\n${locationUrl || 'https://sigremedios.vercel.app'}`;

                // Add appUrl for body click (to keep user in app)
                const appUrl = 'https://sigremedios.vercel.app/';

                const pushData = {
                    type: isHelpRequest ? 'help_request' : 'sos',
                    alertId: String(alert.id),
                    mapUrl: locationUrl || 'https://sigremedios.vercel.app',
                    appUrl: appUrl,
                    phone: String(digits),
                    formattedPhone: String(formattedPhone),
                    patientName: String(patient?.name || 'Alguém'),
                    whatsappMessage: String(whatsappText)
                };

                // Usar o pushBody customizado que inclui o telefone
                const pushTitle = `🚨 EMERGÊNCIA SOS`;
                const pushResult = await sendPushNotification(fcmTokens, pushTitle, pushBody, pushData);
                console.log(`✅ [BACKEND] Push enviado!`);

                // CLEANUP: Remove tokens inválidos do banco
                if (pushResult && pushResult.failureCount > 0) {
                    pushResult.responses.forEach(async (resp, idx) => {
                        if (!resp.success && resp.error?.code === 'messaging/registration-token-not-registered') {
                            const badToken = fcmTokens[idx];
                            console.log(`🗑️ [BACKEND] Removendo token inválido do banco...`);
                            await supabaseAdmin.from('fcm_tokens').delete().eq('token', badToken);
                        }
                    });
                }
            } catch (pushErr) {
                console.error('❌ [BACKEND] Falha ao enviar push:', pushErr.message);
            }
        } else {
            console.log('⚠️ [BACKEND] Nenhum token FCM encontrado para os usuários');
        }

        console.log('🚨 [BACKEND] ===== SOS PROCESSADO =====');

    } catch (err) {
        console.error('❌ [BACKEND] Erro ao processar SOS Realtime:', err);
    }
};

// Handler para UPDATE de SOS (Cuidador confirmou → Notificar paciente)
const handleSOSUpdate = async (payload) => {
    try {
        const alert = payload.new;
        const oldAlert = payload.old;

        // Só processar se o status mudou para 'acknowledged'
        if (alert.status !== 'acknowledged' || oldAlert?.status === 'acknowledged') {
            return;
        }

        console.log('🔔 [BACKEND] ===== SOS ACKNOWLEDGED =====');
        console.log(`📋 Alert ID: ${alert.id}, acknowledged_by: ${alert.acknowledged_by}`);

        // Buscar informações do paciente que disparou o SOS
        const triggeredById = alert.triggered_by;
        if (!triggeredById) {
            console.warn('⚠️ [BACKEND] triggered_by não encontrado');
            return;
        }

        // Buscar FCM token do paciente que disparou o SOS
        const { data: patientTokens } = await supabaseAdmin
            .from('fcm_tokens')
            .select('token')
            .eq('user_id', triggeredById);

        if (!patientTokens || patientTokens.length === 0) {
            console.log('⚠️ [BACKEND] Paciente não tem token FCM registrado');
            return;
        }

        // Buscar nome do cuidador que confirmou
        let caregiverName = 'Seu cuidador';
        if (alert.acknowledged_by) {
            const { data: caregiverProfile } = await supabaseAdmin
                .from('profiles')
                .select('full_name')
                .eq('id', alert.acknowledged_by)
                .single();

            if (caregiverProfile?.full_name) {
                caregiverName = caregiverProfile.full_name.split(' ')[0]; // Primeiro nome
            }
        }

        const tokens = patientTokens.map(t => t.token);
        const pushTitle = '✅ AJUDA A CAMINHO!';
        const pushBody = `${caregiverName} recebeu seu alerta e está a caminho!\n\nFique calmo, ajuda chegando.`;

        const pushData = {
            type: 'sos_acknowledged',
            alertId: String(alert.id),
            caregiverName: String(caregiverName)
        };

        await sendPushNotification(tokens, pushTitle, pushBody, pushData);
        console.log(`✅ [BACKEND] Push de confirmação enviado para paciente (${tokens.length} token(s))`);

    } catch (err) {
        console.error('❌ [BACKEND] Erro ao processar SOS UPDATE:', err);
    }
};

// Iniciar apenas se não estiver na Vercel (serverless)
if (process.env.VERCEL !== '1') {
    startServer();

    // Iniciar Listener Realtime (Se Supabase Admin estiver configurado)
    if (supabaseAdmin) {
        console.log('👂 Iniciando listener de SOS (INSERT + UPDATE)...');
        supabaseAdmin
            .channel('sos-tracker')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sos_alerts' }, handleSOSInsert)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sos_alerts' }, handleSOSUpdate)
            .subscribe((status) => {
                console.log('📡 Status do SOS Listener:', status);
            });
    } else {
        console.warn('⚠️  Listener de SOS não iniciado: supabaseAdmin não configurado.');
    }
}

// Exportar para Vercel serverless functions
export default app;

// Force Restart Trigger by Agent - Debugging Listener
console.log('🔄 [BACKEND] Server file updated. Restarting...');

