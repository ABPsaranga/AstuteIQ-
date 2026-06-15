create table if not exists public.audit_logs (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete set null,
  action text not null,
  resource_type text,
  resource_id text,
  metadata jsonb default '{}',
  ip_address text,
  created_at timestamptz default now()
);

alter table public.audit_logs enable row level security;

create policy "Admins can read audit logs"
  on public.audit_logs for select
  using (auth.jwt() ->> 'role' = 'admin');