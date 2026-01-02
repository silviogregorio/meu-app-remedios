-- =====================================================
-- SETUP: SOS Push Notification via Edge Function
-- =====================================================
-- This creates a Database Webhook that calls the 
-- sos-push Edge Function whenever a new SOS is inserted
-- =====================================================

-- PASSO 1: Verificar se o pg_net está habilitado (necessário para HTTP calls)
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- PASSO 2: Criar a função que chama a Edge Function
CREATE OR REPLACE FUNCTION public.trigger_sos_push_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  edge_function_url TEXT;
  service_role_key TEXT;
  request_id BIGINT;
BEGIN
  -- URL da Edge Function (substitua pelo seu project ref)
  edge_function_url := 'https://' || current_setting('app.settings.supabase_project_ref', true) || '.supabase.co/functions/v1/sos-push';
  
  -- Se não tiver a config, usar URL fixa (SUBSTITUA pelo seu project ref!)
  IF edge_function_url IS NULL OR edge_function_url = '' THEN
    edge_function_url := 'https://ahjywlsnmmkavgtkvpod.supabase.co/functions/v1/sos-push';
  END IF;

  -- Service Role Key para autenticar (precisa estar configurado no vault)
  service_role_key := current_setting('app.settings.service_role_key', true);

  -- Fazer chamada HTTP assíncrona para a Edge Function
  SELECT net.http_post(
    url := edge_function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || COALESCE(service_role_key, '')
    ),
    body := jsonb_build_object(
      'type', 'INSERT',
      'table', 'sos_alerts',
      'record', row_to_json(NEW),
      'schema', 'public'
    )
  ) INTO request_id;

  RAISE LOG 'SOS Push notification triggered. Request ID: %', request_id;
  
  RETURN NEW;
END;
$$;

-- PASSO 3: Criar o trigger na tabela sos_alerts
DROP TRIGGER IF EXISTS on_sos_alert_created ON public.sos_alerts;

CREATE TRIGGER on_sos_alert_created
  AFTER INSERT ON public.sos_alerts
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_sos_push_notification();

-- PASSO 4: Verificar se funcionou
SELECT 'Trigger criado com sucesso!' as status;

-- =====================================================
-- INFORMAÇÕES IMPORTANTES PARA O DEPLOY:
-- =====================================================
-- 
-- 1. DEPLOY DA EDGE FUNCTION:
--    No terminal, navegue até a pasta do projeto e execute:
--    
--    npx supabase functions deploy sos-push --project-ref ahjywlsnmmkavgtkvpod
--
-- 2. CONFIGURAR SECRET DO FIREBASE:
--    No Supabase Dashboard > Edge Functions > sos-push > Secrets
--    Adicione: FIREBASE_SERVICE_ACCOUNT = (conteúdo do seu .json do Firebase Admin)
--
-- 3. TESTAR:
--    Dispare um SOS pelo app e verifique os logs da Edge Function
--    no Supabase Dashboard > Edge Functions > sos-push > Logs
--
-- =====================================================
