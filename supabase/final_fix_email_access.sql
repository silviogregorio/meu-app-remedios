-- SOLUÇÃO DEFINITIVA PARA ERRO 42501 (Permission Denied)
-- O erro ocorre porque o usuário não tem permissão para ler a tabela 'auth.users' diretamente.
-- Vamos substituir por 'auth.jwt() ->> email', que é a forma correta e segura.

-- 1. Dropar e recriar tabela (Garante base limpa)
drop table if exists public.account_shares cascade;

create table public.account_shares (
    id uuid default gen_random_uuid() primary key,
    owner_id uuid not null default auth.uid(),
    shared_with_email text not null,
    created_at timestamptz default now(),
    unique(owner_id, shared_with_email)
);

alter table public.account_shares enable row level security;

-- 2. Políticas Corrigidas (Usando JWT)

-- DONO: Pode fazer tudo se for o dono
create policy "Owner Insert" on public.account_shares for insert with check (auth.uid() = owner_id);
create policy "Owner Select" on public.account_shares for select using (auth.uid() = owner_id);
create policy "Owner Delete" on public.account_shares for delete using (auth.uid() = owner_id);

-- CONVIDADO: Pode VER se o email dele estiver no JWT
create policy "Receiver Select" 
on public.account_shares 
for select 
using (
    shared_with_email = (select auth.jwt() ->> 'email')
);

-- 3. Função Auxiliar Corrigida (Usando JWT)
create or replace function public.has_full_access(resource_owner_id uuid)
returns boolean as $$
begin
    return (
        -- É o dono?
        resource_owner_id = auth.uid()
        OR
        -- É um convidado autorizado? (Verifica email via JWT)
        exists (
            select 1 from public.account_shares
            where owner_id = resource_owner_id
            and shared_with_email = (select auth.jwt() ->> 'email')
        )
    );
end;
$$ language plpgsql security definer;

-- 4. Reaplicar nas Tabelas (Garantir que usam a nova função)
drop policy if exists "Acesso Total Unificado Pacientes" on patients;
create policy "Acesso Total Unificado Pacientes" on patients for all using (public.has_full_access(user_id));

drop policy if exists "Acesso Total Unificado Medicamentos" on medications;
create policy "Acesso Total Unificado Medicamentos" on medications for all using (public.has_full_access(user_id));

drop policy if exists "Acesso Total Unificado Receitas" on prescriptions;
create policy "Acesso Total Unificado Receitas" on prescriptions for all using (public.has_full_access(user_id));
