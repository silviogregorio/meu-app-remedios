-- SOLUÇÃO COMPLETA PARA O COMPARTILHAMENTO
-- Este script corrige todas as permissões de acesso (RLS) para que o convidado veja os dados do dono.

-- 1. Recriar tabela de compartilhamentos (Limpeza)
drop table if exists public.account_shares cascade;
create table public.account_shares (
    id uuid default gen_random_uuid() primary key,
    owner_id uuid not null default auth.uid(),
    shared_with_email text not null,
    created_at timestamptz default now(),
    unique(owner_id, shared_with_email)
);
alter table public.account_shares enable row level security;

-- 2. Políticas da Tabela account_shares
-- Dono gerencia
create policy "Owner Manage" on public.account_shares for all using (auth.uid() = owner_id);
-- Convidado vê (para saber quem compartilhou com ele)
create policy "Guest View" on public.account_shares for select using (
    lower(shared_with_email) = lower(auth.jwt() ->> 'email')
);

-- 3. Função de Verificação de Acesso (USANDO JWT EMAIL)
-- Retorna VERDADEIRO se o usuário for:
-- A) O dono do registro (owner_id)
-- B) Um convidado listado na tabela account_shares para este dono
create or replace function public.check_access(resource_owner_id uuid)
returns boolean as $$
begin
    return (
        -- Cenário A: Sou o dono?
        resource_owner_id = auth.uid()
        OR
        -- Cenário B: O dono compartilhou comigo?
        exists (
            select 1 from public.account_shares
            where owner_id = resource_owner_id
            and lower(shared_with_email) = lower(auth.jwt() ->> 'email')
        )
    );
end;
$$ language plpgsql security definer;

-- 4. Aplicar Políticas nas Tabelas de Dados

-- PACIENTES
drop policy if exists "Acesso Total" on patients;
drop policy if exists "Acesso Total Unificado Pacientes" on patients;
-- Remover quaisquer outras políticas antigas que possam conflitar se necessário
create policy "Acesso Compartilhado Pacientes" on patients for all using (public.check_access(user_id));

-- MEDICAMENTOS
drop policy if exists "Acesso Total" on medications;
drop policy if exists "Acesso Total Unificado Medicamentos" on medications;
create policy "Acesso Compartilhado Medicamentos" on medications for all using (public.check_access(user_id));

-- RECEITAS (PRESCRIPTIONS)
drop policy if exists "Acesso Total" on prescriptions;
drop policy if exists "Acesso Total Unificado Receitas" on prescriptions;
create policy "Acesso Compartilhado Receitas" on prescriptions for all using (public.check_access(user_id));

-- LOG DE CONSUMO (CONSUMPTION_LOG)
-- O log não tem user_id direto do dono (tem taken_by, que é quem tomou). 
-- O acesso deve ser verificado através da RECEITA associada.
drop policy if exists "Acesso Total" on consumption_log;
drop policy if exists "Acesso Log via Receita" on consumption_log;

create policy "Acesso Compartilhado Logs" on consumption_log for all using (
    exists (
        select 1 from prescriptions
        where id = consumption_log.prescription_id
        and public.check_access(prescriptions.user_id)
    )
);

-- 5. Confirmação
select 'Permissões corrigidas com sucesso' as status;
