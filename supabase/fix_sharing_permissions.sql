-- SCRIPT DE CORREÇÃO (Execute este se o anterior falhar)

-- 1. Garantir que a tabela existe (sem erro se já existe)
create table if not exists public.account_shares (
    id uuid default gen_random_uuid() primary key,
    owner_id uuid references auth.users(id) not null,
    shared_with_email text not null,
    created_at timestamptz default now(),
    unique(owner_id, shared_with_email) 
);

-- 2. Habilitar RLS (seguro de rodar múltiplas vezes)
alter table public.account_shares enable row level security;

-- 3. Limpar políticas antigas para evitar conflitos
drop policy if exists "Dono gerencia seus compartilhamentos" on public.account_shares;
drop policy if exists "Usuários veem compartilhamentos recebidos" on public.account_shares;
-- Remover possíveis duplicatas ou nomes antigos
drop policy if exists "Enable read access for all users" on public.account_shares;
drop policy if exists "Enable insert for authenticated users only" on public.account_shares;

-- 4. Recriar Políticas
-- Política Unificada para o Dono (SELECT, INSERT, UPDATE, DELETE)
create policy "Dono gerencia seus compartilhamentos"
    on public.account_shares
    for all
    using (auth.uid() = owner_id)
    with check (auth.uid() = owner_id);

-- Política para quem recebe o compartilhamento (apenas ver)
create policy "Usuários veem compartilhamentos recebidos"
    on public.account_shares
    for select
    using (shared_with_email = (select email from auth.users where id = auth.uid()));

-- 5. Função auxiliar (Recriar para garantir)
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

-- 6. Garantir políticas nas tabelas (sempre boas práticas refazer aqui para garantir)
-- Pacientes
drop policy if exists "Acesso Total Unificado Pacientes" on patients;
create policy "Acesso Total Unificado Pacientes" on patients for all using (public.has_full_access(user_id));

-- Medicamentos
drop policy if exists "Acesso Total Unificado Medicamentos" on medications;
create policy "Acesso Total Unificado Medicamentos" on medications for all using (public.has_full_access(user_id));

-- Receitas
drop policy if exists "Acesso Total Unificado Receitas" on prescriptions;
create policy "Acesso Total Unificado Receitas" on prescriptions for all using (public.has_full_access(user_id));
