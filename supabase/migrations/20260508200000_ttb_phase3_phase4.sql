-- TTB Phase 3 & 4: Audit risk reduction + monthly report generation

-- Cooperage code and gross weight on barrels (required barrel marks per 27 CFR Part 19, Subpart S)
alter table barrels
  add column if not exists cooperage_code text check (cooperage_code in ('C','REC','P','PAR','G','R','PS')),
  add column if not exists gross_weight_lbs numeric;

-- Gauge records (27 CFR 19.618) — required at production, barrel fill, bottling, post-TIB, tamper
create table if not exists gauge_records (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  barrel_id uuid references barrels(id) on delete set null,
  gauge_type text not null check (gauge_type in ('production','fill','bottling','regauge','post_tib','tamper')),
  container_id text not null,
  gauged_at timestamptz not null,
  temperature_f numeric not null,
  proof numeric not null,
  wine_gallons numeric not null,
  proof_gallons numeric not null,
  gauge_officer text not null,
  cooperage_code text check (cooperage_code in ('C','REC','P','PAR','G','R','PS')),
  package_id text,
  gross_weight_lbs numeric,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table gauge_records enable row level security;
create policy "gauge_distillery_read" on gauge_records for select
  using (distillery_id in (select distilleries_i_can_access()));
create policy "gauge_distillery_write" on gauge_records for all
  using (distillery_id in (select distilleries_i_can_write()));
create index if not exists idx_gauge_records_distillery on gauge_records(distillery_id, gauged_at);
create index if not exists idx_gauge_records_barrel on gauge_records(barrel_id);

-- Production account logs (27 CFR 19.571) — mash batches, fermentation, distillation, transfers, losses
create table if not exists production_logs (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  log_type text not null check (log_type in (
    'mash_batch','fermentation','distillation','transfer_to_storage','production_loss'
  )),
  -- mash_batch
  batch_number text,
  grain_bill jsonb,
  grain_quantity_lbs numeric,
  -- fermentation
  fermentation_start date,
  fermentation_end date,
  starting_gravity numeric,
  ending_gravity numeric,
  -- distillation
  still_id text,
  spirits_type text,
  spirits_produced_proof_gallons numeric,
  spirits_produced_wine_gallons numeric,
  -- transfer_to_storage
  transfer_proof_gallons numeric,
  transfer_wine_gallons numeric,
  transfer_proof numeric,
  -- production_loss
  loss_proof_gallons numeric,
  loss_cause text,
  -- common
  occurred_at timestamptz not null default now(),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table production_logs enable row level security;
create policy "production_logs_read" on production_logs for select
  using (distillery_id in (select distilleries_i_can_access()));
create policy "production_logs_write" on production_logs for all
  using (distillery_id in (select distilleries_i_can_write()));
create index if not exists idx_production_logs_distillery on production_logs(distillery_id, occurred_at);

-- Processing account logs (27 CFR 19.601) — bottling, remnant, leaker, tax removals, losses
create table if not exists processing_logs (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  log_type text not null check (log_type in (
    'bottling_run','remnant','leaker','tax_removal','processing_receipt','processing_loss'
  )),
  spirits_type text,
  product_name text,
  proof numeric,
  wine_gallons numeric,
  proof_gallons numeric,
  -- bottling_run
  bottles_filled integer,
  bottle_size_ml numeric,
  case_count integer,
  -- tax_removal
  removal_type text check (removal_type in ('tasting_room','retail','wholesale','export')),
  -- loss
  loss_cause text check (loss_cause in ('breakage','leaker','spillage','evaporation','other')),
  occurred_at timestamptz not null default now(),
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table processing_logs enable row level security;
create policy "processing_logs_read" on processing_logs for select
  using (distillery_id in (select distilleries_i_can_access()));
create policy "processing_logs_write" on processing_logs for all
  using (distillery_id in (select distilleries_i_can_write()));
create index if not exists idx_processing_logs_distillery on processing_logs(distillery_id, occurred_at);

-- Inventory attestations (27 CFR 19.623) — required quarterly (storage) and semi-annually (processing)
-- #1 most cited audit violation is missing signature + perjury statement
create table if not exists inventory_attestations (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  inventory_type text not null check (inventory_type in ('quarterly_storage','semi_annual_processing')),
  period_label text not null,
  inventory_date date not null,
  total_proof_gallons numeric not null default 0,
  barrel_count integer default 0,
  container_count integer default 0,
  inventory_data jsonb not null default '[]',
  attested_by_name text not null,
  attested_by_user_id uuid references auth.users(id),
  attested_at timestamptz,
  status text not null default 'draft' check (status in ('draft','attested')),
  created_at timestamptz default now()
);

alter table inventory_attestations enable row level security;
create policy "inventory_attestations_read" on inventory_attestations for select
  using (distillery_id in (select distilleries_i_can_access()));
create policy "inventory_attestations_write" on inventory_attestations for all
  using (distillery_id in (select distilleries_i_can_write()));
create index if not exists idx_inventory_attestations_distillery on inventory_attestations(distillery_id, inventory_date);
