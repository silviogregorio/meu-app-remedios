import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

const supabaseUrl = 'https://ahjywlsnmmkavgtkvpod.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearTokens() {
    console.log('🗑️ Limpando todos os tokens FCM...');

    const { data: before } = await supabase
        .from('fcm_tokens')
        .select('*');

    console.log(`📊 Tokens antes: ${before?.length || 0}`);

    const { error } = await supabase
        .from('fcm_tokens')
        .delete()
        .neq('token', 'xxx'); // Delete all

    if (error) {
        console.error('❌ Erro:', error);
    } else {
        console.log('✅ Todos os tokens foram removidos!');
        console.log('📱 Agora faça um hard refresh (Ctrl+Shift+R) no navegador para gerar um novo token.');
    }

    process.exit(0);
}

clearTokens();
