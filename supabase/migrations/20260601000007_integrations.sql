-- Accounting / CRM / Drive integration scaffolding. Tables only.
-- OAuth provider credentials must be set before any sync route activates.

create table if not exists integration_connections (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  provider text not null check (provider in ('quickbooks','xero','hubspot','google')),
  status text not null default 'active' check (status in ('active','disconnected','error','expired')),
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  realm_id text,
  tenant_xero_id text,
  hub_portal_id text,
  google_user_email text,
  last_sync_at timestamptz,
  last_sync_status text,
  last_sync_error text,
  sync_cursor jsonb default '{}'::jsonb,
  auto_sync_enabled boolean default true,
  sync_interval_hours integer default 24,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (distillery_id, provider)
);

alter table integration_connections enable row level security;

drop policy if exists "integration_connections_tenant" on integration_connections;

create policy "integration_connections_tenant" on integration_connections
  for all using (distillery_id in (select id from distilleries where owner_id = auth.uid()))
  with check (distillery_id in (select id from distilleries where owner_id = auth.uid()));

create index if not exists idx_integration_connections_distillery on integration_connections(distillery_id, provider);

create table if not exists integration_sync_log (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  connection_id uuid references integration_connections(id) on delete cascade,
  provider text not null,
  operation text not null,
  direction text not null check (direction in ('push','pull')),
  still_record_type text,
  still_record_id uuid,
  provider_record_id text,
  status text not null check (status in ('success','skipped','error')),
  request_payload jsonb,
  response_payload jsonb,
  error_message text,
  synced_at timestamptz default now()
);

alter table integration_sync_log enable row level security;

drop policy if exists "integration_sync_log_tenant" on integration_sync_log;

create policy "integration_sync_log_tenant" on integration_sync_log
  for all using (distillery_id in (select id from distilleries where owner_id = auth.uid()))
  with check (distillery_id in (select id from distilleries where owner_id = auth.uid()));

create index if not exists idx_integration_sync_log_distillery on integration_sync_log(distillery_id, synced_at desc);

create table if not exists integration_record_map (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  provider text not null,
  still_record_type text not null,
  still_record_id uuid not null,
  provider_record_type text not null,
  provider_record_id text not null,
  last_synced_at timestamptz default now(),
  sync_hash text,
  unique (distillery_id, provider, still_record_type, still_record_id)
);

alter table integration_record_map enable row level security;

drop policy if exists "integration_record_map_tenant" on integration_record_map;

create policy "integration_record_map_tenant" on integration_record_map
  for all using (distillery_id in (select id from distilleries where owner_id = auth.uid()))
  with check (distillery_id in (select id from distilleries where owner_id = auth.uid()));

create table if not exists drive_exports (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  export_type text not null,
  report_year integer,
  report_month integer,
  google_file_id text,
  google_file_url text,
  google_spreadsheet_id text,
  status text default 'pending' check (status in ('pending','complete','error')),
  error_message text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table drive_exports enable row level security;

drop policy if exists "drive_exports_tenant" on drive_exports;

create policy "drive_exports_tenant" on drive_exports
  for all using (distillery_id in (select id from distilleries where owner_id = auth.uid()))
  with check (distillery_id in (select id from distilleries where owner_id = auth.uid()));

create index if not exists idx_drive_exports_distillery on drive_exports(distillery_id, created_at desc);
