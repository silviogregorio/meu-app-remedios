import { initFirebaseAdmin, sendPushNotification } from './firebaseAdmin.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = 'https://ahjywlsnmmkavgtvkpod.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPush() {
    console.log('🧪 Iniciando teste de push...');

    await initFirebaseAdmin();

    // Buscar todos os tokens
    const { data: tokens, error } = await supabase
        .from('fcm_tokens')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('❌ Erro ao buscar tokens:', error);
        return;
    }

    console.log(`📱 Tokens encontrados: ${tokens.length}`);
    tokens.forEach((t, idx) => {
        console.log(`  ${idx + 1}. User: ${t.user_id}, Token: ${t.token.substring(0, 30)}...`);
    });

    if (tokens.length === 0) {
        console.log('⚠️ Nenhum token encontrado no banco.');
        return;
    }

    // Enviar push para todos
    const tokenList = tokens.map(t => t.token);

    console.log('\n📨 Enviando push de teste...');
    const result = await sendPushNotification(
        tokenList,
        '🧪 Teste de Notificação',
        'Se você está vendo isso, as notificações push estão funcionando!',
        { type: 'test', timestamp: Date.now().toString() }
    );

    console.log('\n✅ Teste concluído!');
    process.exit(0);
}

testPush();
