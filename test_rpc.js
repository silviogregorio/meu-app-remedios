
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testRpc() {
    console.log('Testing get_tokens_by_emails RPC...');
    try {
        const { data, error } = await supabase.rpc('get_tokens_by_emails', { p_emails: ['test@example.com'] });
        if (error) {
            console.error('❌ RPC Call Failed:', error.message);
            console.log('This confirms the function needs to be created in the DB.');
        } else {
            console.log('✅ RPC Call Success! (Function exists)');
            console.log('Data:', data);
        }
    } catch (e) {
        console.error('Unexpected error:', e);
    }
}

testRpc();
