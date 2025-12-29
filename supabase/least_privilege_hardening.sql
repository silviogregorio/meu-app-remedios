-- SUPABASE LEAST PRIVILEGE HARDENING (V2 - VERIFICADO)
-- Esse script revoga permissões excessivas do papel 'anon' (não autenticado).
-- Execute no Editor SQL do Supabase.

-- 1. Revogar TODAS as permissões do papel 'anon' nas tabelas sensíveis
-- Nomes das tabelas validados via arquivos de migração.

REVOKE ALL ON TABLE public.patients FROM anon;
REVOKE ALL ON TABLE public.medications FROM anon;
REVOKE ALL ON TABLE public.prescriptions FROM anon;
REVOKE ALL ON TABLE public.consumption_log FROM anon;
REVOKE ALL ON TABLE public.account_shares FROM anon;
REVOKE ALL ON TABLE public.patient_shares FROM anon;
REVOKE ALL ON TABLE public.health_logs FROM anon;
REVOKE ALL ON TABLE public.medical_appointments FROM anon;
REVOKE ALL ON TABLE public.audit_logs FROM anon;
REVOKE ALL ON TABLE public.fcm_tokens FROM anon;
REVOKE ALL ON TABLE public.sos_alerts FROM anon;

-- 2. Garantir que o papel 'authenticated' tenha permissão de acesso
-- O RLS (Row Level Security) ainda será o responsável por filtrar QUAIS
-- linhas cada usuário autenticado pode ver.

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.patients TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.medications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.prescriptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.consumption_log TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.account_shares TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.patient_shares TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.health_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.medical_appointments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.audit_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.fcm_tokens TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.sos_alerts TO authenticated;

-- 3. Tabelas Públicas (Landing Page / Configurações)
-- O papel 'anon' pode ler essas tabelas, mas nunca modificar.
GRANT SELECT ON TABLE public.system_settings TO anon, authenticated;
GRANT SELECT ON TABLE public.sponsors TO anon, authenticated;
GRANT SELECT ON TABLE public.ad_offers TO anon, authenticated;

-- 4. Funções RPC
-- Revogar execução pública de funções sensíveis
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM public;
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM anon;

-- Garantir acesso apenas para usuários autenticados e service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;

-- 5. Tabelas de Sistema
-- Bloquear acesso lateral ao esquema de autenticação e extensões
REVOKE USAGE ON SCHEMA extensions FROM anon;
REVOKE USAGE ON SCHEMA auth FROM anon;

SELECT 'Hardening de Menor Privilégio (V2) aplicado com sucesso!' as status;
