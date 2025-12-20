-- Reload PostgREST schema cache to ensure new columns are visible to Realtime/API
NOTIFY pgrst, 'reload config';
