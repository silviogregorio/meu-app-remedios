import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from './emailService.js';

// Lazy getter para Supabase (só cria quando chamado, garantindo que dotenv já rodou)
let _supabaseClient = null;
const getSupabase = () => {
    if (!_supabaseClient) {
        const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            throw new Error('Variáveis de configuração do Supabase (URL/Key) são obrigatórias');
        }

        _supabaseClient = createClient(url, key);
    }
    return _supabaseClient;
};

// Configuração
const BATCH_SIZE = 50; // Processar 50 usuários por vez
const DELAY_BETWEEN_BATCHES = 3000; // 3 segundos entre lotes

let currentCronJob = null; // Armazena o job atual para poder destruir e recriar

/**
 * Busca configurações do banco
 */
const getScheduleConfig = async () => {
    const { data, error } = await getSupabase()
        .from('system_settings')
        .select('weekly_report_enabled, weekly_report_day_of_week, weekly_report_hour')
        .eq('key', 'alerts')
        .single();

    if (error) {
        console.error('⚠️  Erro ao buscar configurações, usando padrão:', error);
        return { enabled: true, dayOfWeek: 1, hour: 9 }; // Padrão: Segunda 9h
    }

    return {
        enabled: data.weekly_report_enabled ?? true,
        dayOfWeek: data.weekly_report_day_of_week ?? 1,
        hour: data.weekly_report_hour ?? 9
    };
};

/**
 * Converte config para formato cron
 */
const buildCronSchedule = (hour, dayOfWeek) => {
    // Formato: minuto hora * * dia-da-semana
    // 0 9 * * 1 = Segunda-feira às 9h
    return `0 ${hour} * * ${dayOfWeek}`;
};

/**
 * Inicia o cron job de resumo semanal
 */
export const startWeeklyReportCron = () => {
    console.log('📊 Configurando cron job de resumo semanal...');

    // Usar config padrão para agendamento inicial (Segunda 9h)
    // O cron lerá config real do banco quando executar
    const defaultSchedule = '0 9 * * 1'; // Segunda-feira 9h

    currentCronJob = cron.schedule(defaultSchedule, async () => {
        console.log('🗓️ [CRON] Iniciando Resumo Semanal Automático...');
        const startTime = Date.now();

        try {
            // Buscar configuração atual do banco
            const config = await getScheduleConfig();

            if (!config.enabled) {
                console.log('⏸️  [CRON] Resumo desabilitado nas configurações');
                return;
            }

            const result = await generateAndSendWeeklyReports();
            const duration = ((Date.now() - startTime) / 1000).toFixed(2);

            console.log(`✅ [CRON] Resumos enviados com sucesso!`);
            console.log(`📊 Total: ${result.sent} enviados, ${result.errors} erros`);
            console.log(`⏱️  Duração: ${duration}s`);
        } catch (error) {
            console.error('❌ [CRON] Erro ao executar resumo semanal:', error);
        }
    });

    console.log(`✅ Cron job agendado: ${defaultSchedule} (Segunda-feira 9h - padrão)`);
    console.log(`ℹ️  O cron lerá configurações reais do banco ao executar`);
    console.log(`ℹ️  Para alterar horário, acesse /admin/settings e reinicie o servidor`);
};

/**
 * Helper para delay entre lotes
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calcula período da semana anterior (segunda a domingo)
 */
const getLastWeekPeriod = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calcular segunda-feira da semana passada
    const dayOfWeek = today.getDay();
    const daysToLastMonday = (dayOfWeek === 0 ? 7 : dayOfWeek) + 6;
    const lastMonday = new Date(today);
    lastMonday.setDate(today.getDate() - daysToLastMonday);

    // Domingo da semana passada
    const lastSunday = new Date(lastMonday);
    lastSunday.setDate(lastMonday.getDate() + 6);

    return {
        startDate: lastMonday.toISOString().split('T')[0],
        endDate: lastSunday.toISOString().split('T')[0],
        periodText: `${formatDate(lastMonday)} a ${formatDate(lastSunday)}`
    };
};

/**
 * Formata data para exibição
 */
const formatDate = (date) => {
    return new Intl.DateTimeFormat('pt-BR', {
        day: '2-digit',
        month: 'short'
    }).format(date);
};

/**
 * Query otimizada que busca TUDO de uma vez
 * Retorna estatísticas agrupadas por usuário e paciente
 */
const getWeeklyStatsOptimized = async (startDate, endDate) => {
    console.log(`📊 Buscando estatísticas de ${startDate} a ${endDate}...`);

    const { data, error } = await getSupabase().rpc('get_weekly_stats', {
        p_start_date: startDate,
        p_end_date: endDate
    });

    if (error) {
        console.error('Erro ao buscar estatísticas:', error);
        throw error;
    }

    // Agrupar por usuário
    const userStats = {};

    data?.forEach(row => {
        const caregiverEmail = row.caregiver_email || row.owner_email;

        if (!userStats[caregiverEmail]) {
            userStats[caregiverEmail] = {
                caregiverEmail,
                caregiverName: row.caregiver_name,
                patients: []
            };
        }

        userStats[caregiverEmail].patients.push({
            patientId: row.patient_id,
            patientName: row.patient_name,
            total: row.expected_doses,
            taken: row.taken_doses,
            pending: row.expected_doses - row.taken_doses,
            adherenceRate: Math.round((row.taken_doses / (row.expected_doses || 1)) * 100)
        });
    });

    console.log(`✅ Estatísticas calculadas para ${Object.keys(userStats).length} destinatários`);
    return userStats;
};

/**
 * Gera e envia relatórios semanais em lote
 */
const generateAndSendWeeklyReports = async () => {
    const period = getLastWeekPeriod();
    let sentCount = 0;
    let errorCount = 0;

    console.log(`📅 Período: ${period.periodText}`);

    // 1. Buscar todas as estatísticas de uma vez (query otimizada)
    const userStats = await getWeeklyStatsOptimized(period.startDate, period.endDate);
    const recipients = Object.values(userStats);

    console.log(`👥 Total de destinatários: ${recipients.length}`);

    if (recipients.length === 0) {
        console.log('ℹ️  Nenhum destinatário encontrado');
        return { sent: 0, errors: 0 };
    }

    // 2. Processar em lotes
    for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const batch = recipients.slice(i, i + BATCH_SIZE);
        const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(recipients.length / BATCH_SIZE);

        console.log(`📦 Processando lote ${batchNumber}/${totalBatches} (${batch.length} emails)...`);

        // Processar lote em paralelo
        const results = await Promise.allSettled(
            batch.map(recipient => sendWeeklySummaryEmail(recipient, period))
        );

        // Contar sucessos e erros
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                sentCount++;
            } else {
                errorCount++;
                console.error(`❌ Erro ao enviar para ${batch[index].caregiverEmail}:`, result.reason);
            }
        });

        // Delay entre lotes (exceto no último)
        if (i + BATCH_SIZE < recipients.length) {
            console.log(`⏸️  Aguardando ${DELAY_BETWEEN_BATCHES}ms antes do próximo lote...`);
            await delay(DELAY_BETWEEN_BATCHES);
        }
    }

    // 3. Registrar no banco (log de auditoria)
    await logWeeklyReport(period.startDate, sentCount, errorCount);

    return { sent: sentCount, errors: errorCount };
};

/**
 * Envia email de resumo semanal para um destinatário
 */
const sendWeeklySummaryEmail = async (recipient, period) => {
    try {
        // Filtrar pacientes com atividade (pelo menos 1 dose esperada)
        const activePatients = recipient.patients.filter(p => p.total > 0);

        if (activePatients.length === 0) {
            console.log(`ℹ️  Pulando ${recipient.caregiverEmail} - sem pacientes ativos`);
            return;
        }

        await sendEmail({
            to: recipient.caregiverEmail,
            subject: `📊 Resumo Semanal - ${period.periodText}`,
            text: 'Versão HTML do resumo semanal',
            type: 'weekly_summary',
            weeklyData: {
                caregiverName: recipient.caregiverName || recipient.caregiverEmail.split('@')[0],
                period: period.periodText,
                startDate: period.startDate,
                endDate: period.endDate,
                patients: activePatients
            }
        });

        console.log(`✅ Email enviado: ${recipient.caregiverEmail} (${activePatients.length} pacientes)`);
    } catch (error) {
        console.error(`❌ Falha ao enviar para ${recipient.caregiverEmail}:`, error.message);
        throw error;
    }
};

/**
 * Registra envio no banco para auditoria
 */
const logWeeklyReport = async (reportDate, sentCount, errorCount) => {
    try {
        const { error } = await getSupabase()
            .from('weekly_report_logs')
            .insert({
                report_date: reportDate,
                users_count: sentCount,
                errors_count: errorCount,
                sent_at: new Date().toISOString()
            });

        if (error) throw error;
        console.log('📝 Log de envio registrado no banco');
    } catch (error) {
        console.error('⚠️  Erro ao registrar log:', error);
    }
};

/**
 * Função para teste manual (development)
 */
export const testWeeklyReport = async () => {
    console.log('🧪 Executando teste manual do resumo semanal...');
    return await generateAndSendWeeklyReports();
};
