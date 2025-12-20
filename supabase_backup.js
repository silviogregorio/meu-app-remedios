// Supabase Backup Script
// Run with: node supabase_backup.js

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config();

// Use same fallback as server/index.js
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ahjywlsnmmkavgtkvpod.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 Connecting to Supabase...');

if (!supabaseKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
    'profiles',
    'patients',
    'medications',
    'prescriptions',
    'consumption_log',
    'motivation_phrases',
    'health_diary',
    'patient_shares',
    'account_shares',
    'sos_alerts',
    'fcm_tokens',
    'sponsors',
    'sponsor_offers'
];

async function backupAllTables() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const backupDir = `./backup_supabase_${timestamp}`;

    fs.mkdirSync(backupDir, { recursive: true });
    console.log(`📁 Backup directory: ${backupDir}\n`);

    let totalRows = 0;

    for (const table of tables) {
        try {
            const { data, error } = await supabase.from(table).select('*');

            if (error) {
                console.warn(`⚠️ ${table}: ${error.message}`);
                continue;
            }

            const filePath = `${backupDir}/${table}.json`;
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            console.log(`✅ ${table}: ${data?.length || 0} rows`);
            totalRows += data?.length || 0;
        } catch (err) {
            console.error(`❌ ${table}: ${err.message}`);
        }
    }

    console.log(`\n🎉 Backup complete! ${totalRows} total rows saved to: ${backupDir}`);
}

backupAllTables();
