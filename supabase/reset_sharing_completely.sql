-- OPÇÃO NUCLEAR: Limpar tudo e recriar do zero
-- Use isso se os outros scripts não funcionaram.

-- 1. Dropar tabela antiga (CUIDADO: APAGA DADOS DA TABELA DE COMPARTILHAMENTO)
drop table if exists public.account_shares cascade;

-- 2. Recriar tabela
create table public.account_shares (
    id uuid default gen_random_uuid() primary key,
    owner_id uuid not null default auth.uid(), -- Preenche automaticamente o ID do usuário logado
    shared_with_email text not null,
    created_at timestamptz default now(),
    unique(owner_id, shared_with_email)
);

-- Nota: Removi a FK 'references auth.users' temporariamente caso seja um problema de permissão de leitura interna,
-- mas num ambiente produtivo real o ideal é manter. Para resolver o "agora", vamos simplificar.

-- 3. Habilitar RLS
alter table public.account_shares enable row level security;

-- 4. Criar Políticas Separadas (Mais seguro e claro)

-- PERMITIR INSERT se você for o dono (auth.uid matches owner_id)
create policy "Allow insert for owners"
on public.account_shares for insert
with check (auth.uid() = owner_id);

-- PERMITIR SELECT se você for o dono
create policy "Allow select for owners"
on public.account_shares for select
using (auth.uid() = owner_id);

-- PERMITIR DELETE se você for o dono
create policy "Allow delete for owners"
on public.account_shares for delete
using (auth.uid() = owner_id);

-- PERMITIR SELECT para quem recebeu o compartilhamento
create policy "Allow select for receivers"
on public.account_shares for select
using (shared_with_email = (select email from auth.users where id = auth.uid()));


-- 5. Atualizar função auxiliar (igual a antes)
create or replace function public.has_full_access(resource_owner_id uuid)
returns boolean as $$
begin
    return (
        -- É o próprio dono?
        resource_owner_id = auth.uid()
        OR
        -- Foi compartilhado com o email atual?
        exists (
            select 1 from public.account_shares
            where owner_id = resource_owner_id
            and shared_with_email = (select email from auth.users where id = auth.uid())
        )
    );
end;
$$ language plpgsql security definer;

-- 6. Reaplicar nas tabelas principais
drop policy if exists "Acesso Total Unificado Pacientes" on patients;
create policy "Acesso Total Unificado Pacientes" on patients for all using (public.has_full_access(user_id));

drop policy if exists "Acesso Total Unificado Medicamentos" on medications;
create policy "Acesso Total Unificado Medicamentos" on medications for all using (public.has_full_access(user_id));

drop policy if exists "Acesso Total Unificado Receitas" on prescriptions;
create policy "Acesso Total Unificado Receitas" on prescriptions for all using (public.has_full_access(user_id));
