
-- Criar tabela para configurações de pasta por usuário
create table public.user_folder_configs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  folder_name text not null,
  folder_handle_data jsonb,
  configured_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  unique(user_id)
);

-- Habilitar RLS
alter table public.user_folder_configs enable row level security;

-- Política para usuários autenticados acessarem apenas seus próprios dados
create policy "Users can access their own folder configs" on public.user_folder_configs
  for all using (auth.uid() = user_id);

-- Trigger para atualizar updated_at
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

create trigger update_user_folder_configs_updated_at
  before update on public.user_folder_configs
  for each row execute function public.update_updated_at_column();
