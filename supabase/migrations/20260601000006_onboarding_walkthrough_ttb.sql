-- Onboarding wizard + walkthrough tour + DSP / bond / station / monthly-summary tables.
-- Reuses existing production_logs / processing_logs / account_transfers for record entries.

-- ── distilleries: onboarding tracking columns ────────────────────────────────
alter table distilleries
  add column if not exists onboarding_completed boolean default false;

alter table distilleries
  add column if not exists onboarding_step integer default 1;

alter table distilleries
  add column if not exists onboarding_data jsonb default '{}'::jsonb;

-- ── walkthrough_progress ─────────────────────────────────────────────────────
create table if not exists walkthrough_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  distillery_id uuid references distilleries(id) on delete cascade,
  tour_id text not null default 'main',
  completed_steps integer[] default '{}',
  current_step integer default 0,
  completed_at timestamptz,
  dismissed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (user_id, tour_id)
);

alter table walkthrough_progress enable row level security;

drop policy if exists "walkthrough_progress_own" on walkthrough_progress;

create policy "walkthrough_progress_own" on walkthrough_progress
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create index if not exists idx_walkthrough_progress_user on walkthrough_progress(user_id);

-- ── dsp_registration ─────────────────────────────────────────────────────────
create table if not exists dsp_registration (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade unique,
  dsp_number text,
  dsp_permit_date date,
  plant_name text,
  trade_name text,
  ein text,
  entity_type text,
  principal_name text,
  principal_title text,
  street_address text,
  city text,
  state text,
  zip text,
  county text,
  mailing_same boolean default true,
  mailing_address text,
  mailing_city text,
  mailing_state text,
  mailing_zip text,
  operations_type text[] default '{}',
  spirits_categories text[] default '{}',
  dsp_skipped boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table dsp_registration enable row level security;

drop policy if exists "dsp_registration_tenant" on dsp_registration;

create policy "dsp_registration_tenant" on dsp_registration
  for all using (distillery_id in (select id from distilleries where owner_id = auth.uid()))
  with check (distillery_id in (select id from distilleries where owner_id = auth.uid()));

-- ── dsp_bond ─────────────────────────────────────────────────────────────────
create table if not exists dsp_bond (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  bond_type text not null check (bond_type in ('operations','unit_bond','tax_deferral','waiver')),
  bond_number text,
  surety_company text,
  bond_amount numeric(12,2),
  penal_sum numeric(12,2),
  effective_date date,
  expiration_date date,
  renewal_required boolean default true,
  is_active boolean default true,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table dsp_bond enable row level security;

drop policy if exists "dsp_bond_tenant" on dsp_bond;

create policy "dsp_bond_tenant" on dsp_bond
  for all using (distillery_id in (select id from distilleries where owner_id = auth.uid()))
  with check (distillery_id in (select id from distilleries where owner_id = auth.uid()));

create index if not exists idx_dsp_bond_distillery on dsp_bond(distillery_id, is_active);

-- ── production_station (config, separate from logs) ──────────────────────────
create table if not exists production_station (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade unique,
  fermenter_count integer default 1,
  fermenters jsonb default '[]'::jsonb,
  typical_mash_size_gallons numeric(10,2),
  typical_fermentation_days integer,
  stills jsonb default '[]'::jsonb,
  water_source text,
  water_notes text,
  grain_bill_templates jsonb default '[]'::jsonb,
  yeast_types text[] default '{}',
  default_distillate_proof numeric(5,2),
  proof_measurement_method text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table production_station enable row level security;

drop policy if exists "production_station_tenant" on production_station;

create policy "production_station_tenant" on production_station
  for all using (distillery_id in (select id from distilleries where owner_id = auth.uid()))
  with check (distillery_id in (select id from distilleries where owner_id = auth.uid()));

-- ── storage_station ──────────────────────────────────────────────────────────
create table if not exists storage_station (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade unique,
  warehouses jsonb default '[]'::jsonb,
  default_cooperage_code text default 'C',
  default_oak_origin text,
  typical_barrel_sizes jsonb default '[]'::jsonb,
  typical_entry_proof_min numeric(5,2) default 100,
  typical_entry_proof_max numeric(5,2) default 125,
  annual_evaporation_rate_pct numeric(5,3) default 2.0,
  package_number_prefix text,
  package_number_sequence integer default 1,
  package_number_format text default '{PREFIX}-{YEAR}-{SEQ:04}',
  location_format text default 'W{warehouse}-R{rack}-B{bay}-L{level}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table storage_station enable row level security;

drop policy if exists "storage_station_tenant" on storage_station;

create policy "storage_station_tenant" on storage_station
  for all using (distillery_id in (select id from distilleries where owner_id = auth.uid()))
  with check (distillery_id in (select id from distilleries where owner_id = auth.uid()));

-- ── processing_station ───────────────────────────────────────────────────────
create table if not exists processing_station (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade unique,
  bottle_sizes jsonb default '[]'::jsonb,
  cola_approvals jsonb default '[]'::jsonb,
  gauging_method text default 'hydrometer',
  gauging_temperature numeric(4,1) default 60.0,
  operations text[] default '{}',
  federal_excise_tax_rate numeric(8,4),
  tax_deferral_eligible boolean default true,
  annual_proof_gallons_estimate numeric(12,2),
  typical_bottling_loss_pct numeric(5,3) default 1.0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table processing_station enable row level security;

drop policy if exists "processing_station_tenant" on processing_station;

create policy "processing_station_tenant" on processing_station
  for all using (distillery_id in (select id from distilleries where owner_id = auth.uid()))
  with check (distillery_id in (select id from distilleries where owner_id = auth.uid()));

-- ── production_logs / processing_logs: add perjury attestation columns ───────
alter table production_logs add column if not exists penalties_of_perjury boolean default false;

alter table production_logs add column if not exists signed_at timestamptz;

alter table production_logs add column if not exists batch_id text;

alter table processing_logs add column if not exists penalties_of_perjury boolean default false;

alter table processing_logs add column if not exists signed_at timestamptz;

alter table processing_logs add column if not exists batch_id text;

alter table processing_logs add column if not exists barrels_used jsonb default '[]'::jsonb;

alter table processing_logs add column if not exists pre_filtration_proof numeric(5,2);

alter table processing_logs add column if not exists post_filtration_proof numeric(5,2);

alter table processing_logs add column if not exists proofing_water_gallons numeric(10,4);

alter table processing_logs add column if not exists final_bottling_proof numeric(5,2);

alter table processing_logs add column if not exists tax_determination_date date;

alter table processing_logs add column if not exists excise_tax_owed numeric(10,2);

alter table processing_logs add column if not exists cola_id text;

-- ── monthly_operations_summary (Form 5110.40 support) ────────────────────────
create table if not exists monthly_operations_summary (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  report_year integer not null,
  report_month integer not null check (report_month between 1 and 12),
  spirits_category text not null,
  on_hand_beginning_wg numeric(12,4) default 0,
  on_hand_beginning_pg numeric(12,4) default 0,
  produced_wg numeric(12,4) default 0,
  produced_pg numeric(12,4) default 0,
  received_in_bond_wg numeric(12,4) default 0,
  received_in_bond_pg numeric(12,4) default 0,
  returned_from_processing_wg numeric(12,4) default 0,
  returned_from_processing_pg numeric(12,4) default 0,
  transferred_in_bond_wg numeric(12,4) default 0,
  transferred_in_bond_pg numeric(12,4) default 0,
  transferred_to_processing_wg numeric(12,4) default 0,
  transferred_to_processing_pg numeric(12,4) default 0,
  dumped_for_bottling_wg numeric(12,4) default 0,
  dumped_for_bottling_pg numeric(12,4) default 0,
  destruction_wg numeric(12,4) default 0,
  destruction_pg numeric(12,4) default 0,
  inventory_losses_wg numeric(12,4) default 0,
  inventory_losses_pg numeric(12,4) default 0,
  on_hand_end_wg numeric(12,4) default 0,
  on_hand_end_pg numeric(12,4) default 0,
  proof_gallons_removed_taxpaid numeric(12,4) default 0,
  estimated_tax_liability numeric(12,2) default 0,
  is_finalized boolean default false,
  finalized_at timestamptz,
  finalized_by uuid references auth.users(id),
  penalties_of_perjury boolean default false,
  attested_by uuid references auth.users(id),
  attested_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (distillery_id, report_year, report_month, spirits_category)
);

alter table monthly_operations_summary enable row level security;

drop policy if exists "monthly_ops_tenant" on monthly_operations_summary;

create policy "monthly_ops_tenant" on monthly_operations_summary
  for all using (distillery_id in (select id from distilleries where owner_id = auth.uid()))
  with check (distillery_id in (select id from distilleries where owner_id = auth.uid()));

drop policy if exists "monthly_ops_no_update_finalized" on monthly_operations_summary;

create policy "monthly_ops_no_update_finalized" on monthly_operations_summary
  for update using (distillery_id in (select id from distilleries where owner_id = auth.uid()) and is_finalized = false);

drop policy if exists "monthly_ops_no_delete_finalized" on monthly_operations_summary;

create policy "monthly_ops_no_delete_finalized" on monthly_operations_summary
  for delete using (distillery_id in (select id from distilleries where owner_id = auth.uid()) and is_finalized = false);
