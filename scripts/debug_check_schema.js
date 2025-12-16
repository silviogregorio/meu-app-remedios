
import { createClient } from '@supabase/supabase-js';
import { supabaseUrl, supabaseAnonKey } from '../src/lib/supabase.js';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkSchema() {
    console.log('Checking ad_offers columns...');
    const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: 'ad_offers' })
    // Fallback if no RPC: just query limits if allowed, or we can use error to infer.
    // But better: insert a dummy check or read row.

    // Standard way to check columns if we don't have direct SQL access:
    // Try to select * limit 1 and print keys.
    const { data: rows, error: selectError } = await supabase
        .from('ad_offers')
        .select('*')
        .limit(1);

    if (selectError) {
        console.error('Error selecting:', selectError);
    } else if (rows && rows.length > 0) {
        console.log('Columns found:', Object.keys(rows[0]));
    } else {
        console.log('Table empty, checking by inserting dummy and catching error? No, lets rely on migration history.');
        // If empty, I can't see keys. 
    }
}

checkSchema();
