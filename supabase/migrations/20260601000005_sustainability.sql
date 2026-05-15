-- Feature 6: Sustainability + carbon tracker

alter table barrels add column if not exists grain_source_type text check (grain_source_type in ('local','regional','commodity','unknown')) default 'unknown';
alter table barrels add column if not exists grain_source_location text;

create table if not exists production_sustainability_log (
  id uuid default gen_random_uuid() primary key,
  distillery_id uuid references distilleries(id) on delete cascade not null,
  production_run_id uuid,
  log_date date not null,
  water_usage_gallons numeric(10,2),
  energy_kwh numeric(10,2),
  waste_kg numeric(10,2),
  grain_source_type text check (grain_source_type in ('local','regional','commodity','unknown')),
  grain_lbs numeric(10,2),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table production_sustainability_log enable row level security;
create policy "members_read_sust"  on production_sustainability_log for select using (distillery_id in (select distilleries_i_can_access()));
create policy "writers_write_sust" on production_sustainability_log for all    using (distillery_id in (select distilleries_i_can_write()));

create trigger production_sustainability_log_updated_at before update on production_sustainability_log
  for each row execute function update_updated_at();

create index if not exists idx_sust_dist_date on production_sustainability_log(distillery_id, log_date desc);
