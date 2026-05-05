create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null,
  admin_email text not null,
  action text not null,
  target_user_id uuid,
  target_email text,
  metadata jsonb default '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz default now()
);

alter table audit_log enable row level security;

create policy "super_admin_read_audit" on audit_log for select
  using ((select is_super_admin from user_profiles where id = auth.uid()) = true);

create policy "service_insert_audit" on audit_log for insert with check (true);

create index if not exists idx_audit_log_admin on audit_log(admin_user_id);
create index if not exists idx_audit_log_target on audit_log(target_user_id);
create index if not exists idx_audit_log_created on audit_log(created_at desc);
