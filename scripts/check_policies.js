
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ahjywlsnmmkavgtkvpod.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFoanl3bHNubW1rYXZndGt2cG9kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ1MTU1NzIsImV4cCI6MjA4MDA5MTU3Mn0.jBnLg-LxGDoSTxiSvRVaSgQZDbr0h91Uxm2S7YBcMto';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPolicies() {
    // We can't query pg_catalog directly via postgrest usually unless exposed.
    // But we can try to use RPC if available, or just guess. 
    // Wait, the user has to run SQL. I can't check pg_policies from client unless I have a function for it.

    // Alternative: Try to fetch as anonymous with the specific query again.
    // The previous script worked, which used ANON key.
    // This confirms ANON access works.

    console.log("Checking Anon Access...");
    const { data, error } = await supabase
        .from('ad_offers')
        .select('*, sponsor: sponsors!inner(*)')
        .eq('active', true);

    if (error) console.error("Anon Error:", error);
    else console.log(`Anon Access Count: ${data.length}`);
}

checkPolicies();
