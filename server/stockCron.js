import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { sendPushNotification } from './firebaseAdmin.js';

let _supabaseClient = null;
const getSupabase = () => {
    if (!_supabaseClient) {
        const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            throw new Error('Supabase URL ou Key não encontrados no ambiente.');
        }

        _supabaseClient = createClient(url, key);
    }
    return _supabaseClient;
};

export const checkLowStockAndNotify = async () => {
    console.log('📦 [STOCK CRON] Checking for low stock medications...');
    try {
        const supabase = getSupabase();

        // 1. Fetch medications with low stock (quantity <= 5)
        const { data: lowStockMeds, error } = await supabase
            .from('medications')
            .select(`
                id,
                name,
                quantity,
                unit_quantity,
                user_id,
                profiles:user_id (full_name)
            `)
            .lte('quantity', 5)
            .gte('quantity', 0); // Include 0

        if (error) throw error;

        if (!lowStockMeds || lowStockMeds.length === 0) {
            console.log('📦 [STOCK CRON] No low stock medications found.');
            return;
        }

        console.log(`📦 [STOCK CRON] Found ${lowStockMeds.length} items with low stock.`);

        // 2. Group by User
        const userMap = new Map();
        for (const med of lowStockMeds) {
            if (!userMap.has(med.user_id)) {
                userMap.set(med.user_id, []);
            }
            userMap.get(med.user_id).push(med);
        }

        // 3. Send Notifications
        for (const [userId, meds] of userMap.entries()) {
            // Get tokens
            const { data: tokens } = await supabase
                .from('fcm_tokens')
                .select('token')
                .eq('user_id', userId);

            if (tokens && tokens.length > 0) {
                const tokenList = tokens.map(t => t.token);

                // Separate Zero vs Low
                const zeroStock = meds.filter(m => m.quantity === 0);
                const lowStock = meds.filter(m => m.quantity > 0);

                let title = "⚠️ Aviso de Estoque";
                let body = "";

                if (zeroStock.length > 0) {
                    title = "🚨 ATENÇÃO: Medicamento Acabou!";
                    const names = zeroStock.map(m => m.name).join(', ');
                    if (zeroStock.length === 1) {
                        body = `O estoque de ${names} ZEROU! 😱 Reponha agora para não interromper o tratamento.`;
                    } else {
                        body = `URGENTE: ${zeroStock.length} medicamentos acabaram: ${names}.`;
                    }

                    if (lowStock.length > 0) {
                        body += `\n⚠️ E outros ${lowStock.length} estão acabando.`;
                    }
                } else {
                    // Only low stock
                    title = "📦 Estoque Baixo";
                    if (lowStock.length === 1) {
                        body = `O medicamento ${lowStock[0].name} está acabando! Restam apenas ${lowStock[0].quantity}.`;
                    } else {
                        const names = lowStock.map(m => m.name).join(', ');
                        body = `Hora de repor o estoque! ${lowStock.length} itens estão acabando: ${names}.`;
                    }
                }

                try {
                    await sendPushNotification(tokenList, title, body, {
                        type: 'stock_alert',
                        medicationIds: meds.map(m => m.id).join(',')
                    });
                    console.log(`✅ [STOCK CRON] Sent alert to user ${userId}`);
                } catch (pushErr) {
                    console.error(`❌ [STOCK CRON] Failed to send to user ${userId}:`, pushErr.message);
                }
            }
        }

    } catch (err) {
        console.error('❌ [STOCK CRON] Error:', err);
    }
};

export const startStockCron = () => {
    console.log('📦 Configurando cron job de Estoque...');

    // Run every day at 10:00 AM
    cron.schedule('0 10 * * *', async () => {
        try {
            await checkLowStockAndNotify();
        } catch (err) {
            console.error('❌ [STOCK CRON ERROR]', err);
        }
    });

    console.log('✅ Cron job de Estoque ativado (Diariamente às 10:00)');
};
