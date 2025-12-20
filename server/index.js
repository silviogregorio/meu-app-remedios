import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { body, validationResult } from 'express-validator';
import rateLimit from 'express-rate-limit';
import { sendEmail, verifyConnection } from './emailService.js';
import { initFirebaseAdmin, sendPushNotification } from './firebaseAdmin.js';
import { createClient } from '@supabase/supabase-js';

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

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

        const { to, subject, text, observations, type, senderName, senderEmail, sosData, reportData, healthLogsData, healthLogsByPatient, attachments, tokens } = req.body;

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
        const result = await sendEmail({ to, subject, text, observations, type, senderName, senderEmail, sosData, reportData, healthLogsData, healthLogsByPatient, attachments });

        // Enviar Push (Opcional ou Automático para SOS)
        let targetTokens = tokens || [];

        if (type === 'sos' && to && targetTokens.length === 0) {
            try {
                const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ahjywlsnmmkavgtkvpod.supabase.co';
                const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoanl3bHNubW1rYXZndGt2cG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTU1NzIsImV4cCI6MjA4MDA5MTU3Mn0.jBnLg-LxGDoSTxiSvRVaSgQZDbr0h91Uxm2S7YBcMto';
                const authHeader = req.headers.authorization;
                if (authHeader) {
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

            // Inicializar Firebase Admin
            initFirebaseAdmin().catch(err => console.error('Erro ao inicializar Firebase Admin:', err));
        });

    } catch (error) {
        console.error('❌ Erro ao iniciar servidor:', error);
        process.exit(1);
    }
};

// Inicializar Supabase Admin (Necessário Service Role para ouvir todas as tabelas)
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ahjywlsnmmkavgtkvpod.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

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
        const subject = `🚨 EMERGÊNCIA SOS: ${patient?.name || 'Alerta'}`;
        const locationText = displayAddress
            ? `${displayAddress}\n(Ver no mapa: ${locationUrl || 'Coordenadas indisponíveis'})`
            : locationUrl || 'Localização não disponível';
        const text = `ALERTA DE PÂNICO!\n\nPaciente: ${patient?.name}\nMedicamentos: ${medicationsList.join(', ') || 'N/A'}\nContato Emergência: ${patient?.emergency_contact_name || 'N/A'} (${patient?.emergency_contact_phone || 'N/A'})\n\nLocalização: ${locationText}\nPrecisão: ${Math.round(alert.accuracy || 0)}m`;

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
            const digits = phoneForWhatsapp.replace(/\D/g, '');
            if (digits.length === 11) {
                formattedPhone = `(${digits.substring(0, 2)}) ${digits.substring(2, 7)}-${digits.substring(7)}`;
            } else if (digits.length === 10) {
                formattedPhone = `(${digits.substring(0, 2)}) ${digits.substring(2, 6)}-${digits.substring(6)}`;
            }

            // Formatar texto para o Push Body para garantir que o telefone apareça
            const pushPhoneText = phoneForWhatsapp ? `\n📞 Tel: ${formattedPhone}` : '';
            const pushBody = `${patient?.name || 'Alguém'} precisa de ajuda!${pushPhoneText}\n📍 ${displayAddress || 'Ver localização'}`;

            try {
                console.log(`📱 [BACKEND] Tentando push para ${fcmTokens.length} token(s)`);
                const pushData = {
                    type: 'sos',
                    alertId: String(alert.id),
                    mapUrl: locationUrl || 'https://sigremedios.vercel.app',
                    phone: String(digits), // ENVIAR APENAS DIGITOS PARA O WHATSAPP LINK
                    patientName: String(patient?.name || 'Alguém')
                };

                // Usar o pushBody customizado que inclui o telefone
                const pushResult = await sendPushNotification(fcmTokens, subject, pushBody, pushData);
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

// Iniciar apenas se não estiver na Vercel (serverless)
if (process.env.VERCEL !== '1') {
    startServer();

    // Iniciar Listener Realtime
    console.log('👂 Iniciando listener de SOS...');
    supabaseAdmin
        .channel('sos-tracker')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'sos_alerts' }, handleSOSInsert)
        .subscribe((status) => {
            console.log('📡 Status do SOS Listener:', status);
        });
}

// Exportar para Vercel serverless functions
export default app;

// Force Restart Trigger by Agent - Debugging Listener
console.log('🔄 [BACKEND] Server file updated. Restarting...');

