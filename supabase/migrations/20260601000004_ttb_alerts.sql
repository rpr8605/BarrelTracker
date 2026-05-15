-- Feature 5: TTB regulatory change alerts

create table if not exists regulatory_alerts (
  id uuid default gen_random_uuid() primary key,
  source_url text not null unique,
  title text not null,
  summary text not null,
  action_required text,
  effective_date date,
  affects_types text[] default '{}',
  raw_content text,
  published_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists alert_deliveries (
  id uuid default gen_random_uuid() primary key,
  distillery_id uuid references distilleries(id) on delete cascade not null,
  alert_id uuid references regulatory_alerts(id) on delete cascade not null,
  delivered_at timestamptz default now(),
  read_at timestamptz,
  dismissed_at timestamptz,
  unique(distillery_id, alert_id)
);

create table if not exists alert_preferences (
  id uuid default gen_random_uuid() primary key,
  distillery_id uuid references distilleries(id) on delete cascade not null unique,
  email_enabled boolean default true,
  push_enabled boolean default true,
  permit_types text[] default '{DSP}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table regulatory_alerts  enable row level security;
alter table alert_deliveries   enable row level security;
alter table alert_preferences  enable row level security;

create policy "anyone_read_alerts"   on regulatory_alerts for select using (true);
create policy "members_read_deliv"   on alert_deliveries  for select using (distillery_id in (select distilleries_i_can_access()));
create policy "writers_update_deliv" on alert_deliveries  for update using (distillery_id in (select distilleries_i_can_write()));
create policy "members_read_pref"    on alert_preferences for select using (distillery_id in (select distilleries_i_can_access()));
create policy "writers_write_pref"   on alert_preferences for all    using (distillery_id in (select distilleries_i_can_write()));

create trigger alert_preferences_updated_at before update on alert_preferences
  for each row execute function update_updated_at();

create index if not exists idx_deliv_dist on alert_deliveries(distillery_id, delivered_at desc);
create index if not exists idx_deliv_unread on alert_deliveries(distillery_id) where read_at is null;
