
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahjywlsnmmkavgtkvpod.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoanl3bHNubW1rYXZndGt2cG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTU1NzIsImV4cCI6MjA4MDA5MTU3Mn0.jBnLg-LxGDoSTxiSvRVaSgQZDbr0h91Uxm2S7YBcMto';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
    console.log('--- CHECKING SPONSORS ---');
    const { data: sponsors, error: sErr } = await supabase.from('sponsors').select('*');
    if (sErr) console.error(sErr);
    else console.log(JSON.stringify(sponsors.map(s => ({ id: s.id, name: s.name, city: s.city, ibge: s.ibge_code, active: s.active })), null, 2));

    console.log('\n--- CHECKING OFFERS ---');
    const { data: offers, error: oErr } = await supabase.from('ad_offers').select('*');
    if (oErr) console.error(oErr);
    else console.log(JSON.stringify(offers.map(o => ({ id: o.id, title: o.title, sponsor: o.sponsor_id, active: o.active, expires_at: o.expires_at })), null, 2));
}

check();
