-- 1. Tabela de Compartilhamento de Conta
create table if not exists public.account_shares (
    id uuid default gen_random_uuid() primary key,
    owner_id uuid references auth.users(id) not null,
    shared_with_email text not null,
    created_at timestamptz default now(),
    -- Garante que não compartilhe duas vezes com a mesma pessoa
    unique(owner_id, shared_with_email) 
);

-- 2. Habilitar RLS
alter table public.account_shares enable row level security;

-- 3. Políticas para a tabela de compartilhamento
-- O dono pode ver, adicionar e remover seus compartilhamentos
create policy "Dono gerencia seus compartilhamentos"
    on public.account_shares
    for all
    using (auth.uid() = owner_id);

-- Usuários podem ver quem compartilhou com eles (opcional, para UI futura)
create policy "Usuários veem compartilhamentos recebidos"
    on public.account_shares
    for select
    using (shared_with_email = (select email from auth.users where id = auth.uid()));

-- 4. Função auxiliar para verificar acesso
-- Retorna TRUE se o usuário atual (auth.uid) for o dono OU se o email dele estiver na lista de compartilhamento do dono
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

-- 5. Atualizar Políticas das Tabelas Principais (Pacientes, Medicamentos, Receitas)

-- Pacientes
drop policy if exists "Users can insert their own patients" on patients;
drop policy if exists "Users can select their own patients" on patients;
drop policy if exists "Users can update their own patients" on patients;
drop policy if exists "Users can delete their own patients" on patients;
-- (Caso tenha políticas genéricas antigas, remova-as e aplique a nova unificada)

create policy "Acesso Total Unificado Pacientes"
    on patients for all
    using (public.has_full_access(user_id));

-- Medicamentos
drop policy if exists "Users can insert their own medications" on medications;
drop policy if exists "Users can select their own medications" on medications;
drop policy if exists "Users can update their own medications" on medications;
drop policy if exists "Users can delete their own medications" on medications;

create policy "Acesso Total Unificado Medicamentos"
    on medications for all
    using (public.has_full_access(user_id));

-- Receitas (Prescriptions)
drop policy if exists "Users can insert their own prescriptions" on prescriptions;
drop policy if exists "Users can select their own prescriptions" on prescriptions;
drop policy if exists "Users can update their own prescriptions" on prescriptions;
drop policy if exists "Users can delete their own prescriptions" on prescriptions;

create policy "Acesso Total Unificado Receitas"
    on prescriptions for all
    using (public.has_full_access(user_id));

-- Log de Consumo (Consumption Log)
-- O log geralmente está ligado a uma receita ou paciente. Mas o log tem 'taken_by'.
-- Se quisermos que o compartilhado veja o log, ele precisa ter acesso à receita associada.
-- Assumindo que consumption_log tem prescription_id.
create policy "Acesso Log via Receita"
    on consumption_log for all
    using (
        exists (
            select 1 from prescriptions
            where id = consumption_log.prescription_id
            and public.has_full_access(prescriptions.user_id)
        )
    );
