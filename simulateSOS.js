
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, './.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function simulateSOS() {
    const email = 'sigsis@gmail.com';
    console.log(`🚀 Buscando usuário: ${email}`);

    // 1. Get User ID
    const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single();

    if (profileError || !profiles) {
        console.error('❌ Erro ao buscar perfil:', profileError?.message || 'Não encontrado');
        return;
    }

    const userId = profiles.id;
    console.log(`✅ ID encontrado: ${userId}`);

    // 2. Get a Patient for this user
    const { data: patients } = await supabase
        .from('patients')
        .select('id, name')
        .eq('user_id', userId)
        .limit(1);

    if (!patients || patients.length === 0) {
        console.error('❌ Nenhum paciente encontrado para este usuário.');
        return;
    }

    const patient = patients[0];
    console.log(`👨‍⚕️ Disparando SOS para o paciente: ${patient.name}`);

    // 3. Insert SOS Alert
    const { data: newAlert, error: alertError } = await supabase
        .from('sos_alerts')
        .insert({
            patient_id: patient.id,
            triggered_by: userId,
            status: 'active',
            location_lat: -23.5505,
            location_lng: -46.6333,
            address: '🚨 TESTE GLOBAL - ' + new Date().toLocaleTimeString()
        })
        .select()
        .single();

    if (alertError) {
        console.error('❌ Erro ao disparar SOS:', alertError.message);
    } else {
        console.log(`🔥 SOS DISPARADO COM SUCESSO! ID: ${newAlert.id}`);
        console.log('👀 Verifique seu navegador agora mesmo!');
    }
}

simulateSOS();
