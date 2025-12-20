-- Enable pg_cron expansion if not already enabled
-- OBS: This usually requires contact with Supabase support or using the Dashboard
-- But here is the standard SQL implementation via pg_net or pg_cron.

-- 1. Enable extensions
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Schedule the missed dose check every hour at minute 0
-- Replace <PROJECT_REF> with your actual project ID
-- Replace <SERVICE_ROLE_KEY> with your service role key (found in API settings)
SELECT cron.schedule(
    'check-missed-doses-hourly',
    '0 * * * *',
    $$
    SELECT net.http_post(
        url := 'https://<PROJECT_REF>.functions.supabase.co/check-missed-doses',
        headers := '{"Content-Type": "application/json", "Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
    )
    $$
);

-- Note: You can also use the Supabase Dashboard UI (Edge Functions > Cron) 
-- to set this up without raw SQL if preferred.
