
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahjywlsnmmkavgtkvpod.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoanl3bHNubW1rYXZndGt2cG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTU1NzIsImV4cCI6MjA4MDA5MTU3Mn0.jBnLg-LxGDoSTxiSvRVaSgQZDbr0h91Uxm2S7YBcMto';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    const ibgeCode = '3515509'; // String
    const ibgeCodeNum = 3515509; // Number

    console.log(`Testing with String: "${ibgeCode}"`);
    const { data: d1, error: e1 } = await supabase
        .from('ad_offers')
        .select('*, sponsor: sponsors!inner(*)')
        .eq('active', true)
        .eq('sponsor.active', true)
        .eq('sponsor.ibge_code', ibgeCode);

    if (e1) console.error(e1);
    else console.log(`Found ${d1.length} offers (String)`);

    console.log(`\nTesting with Number: ${ibgeCodeNum}`);
    const { data: d2, error: e2 } = await supabase
        .from('ad_offers')
        .select('*, sponsor: sponsors!inner(*)')
        .eq('active', true)
        .eq('sponsor.active', true)
        .eq('sponsor.ibge_code', ibgeCodeNum);

    if (e2) console.error(e2);
    else console.log(`Found ${d2.length} offers (Number)`);
}

check();
