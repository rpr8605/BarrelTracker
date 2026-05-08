-- Tier 2: Normalized production + processing account tables
-- Replaces flat production_logs / processing_logs for proper 5110.40 / 5110.28 computation

-- ── Production account ─────────────────────────────────────────────────────────

create table if not exists mash_batches (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  batch_number text not null,
  mash_date date not null,
  transaction_date date not null,
  entry_timestamp timestamptz default now(),
  grains jsonb not null default '[]', -- [{grain_type, quantity_lbs}]
  total_grain_lbs numeric(10,2),
  water_gallons numeric(8,2),
  vessel_id text,
  notes text,
  is_late_entry boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  constraint mash_no_neg_grain check (total_grain_lbs is null or total_grain_lbs >= 0)
);
alter table mash_batches enable row level security;
create policy "mash_batches_distillery" on mash_batches for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));
create index if not exists idx_mash_batches_distillery_date on mash_batches(distillery_id, mash_date desc);

create table if not exists fermentation_logs (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  mash_batch_id uuid references mash_batches(id),
  fermentation_vessel text not null,
  start_date date not null,
  start_og numeric(6,3),
  end_date date,
  end_fg numeric(6,3),
  estimated_abv numeric(5,2),
  status text default 'active' check (status in ('active','complete','dumped')),
  transaction_date date not null,
  entry_timestamp timestamptz default now(),
  is_late_entry boolean default false,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table fermentation_logs enable row level security;
create policy "fermentation_logs_distillery" on fermentation_logs for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));
create index if not exists idx_fermentation_logs_distillery on fermentation_logs(distillery_id, start_date desc);

create table if not exists distillation_logs (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  fermentation_log_id uuid references fermentation_logs(id),
  still_id text not null,
  spirits_type text not null default 'bourbon',
  distillation_date date not null,
  run_type text check (run_type in ('stripping','spirit','single_pass')),
  low_wines_gallons numeric(8,4),
  low_wines_proof numeric(6,3),
  hearts_gallons numeric(8,4),
  hearts_proof numeric(6,3),
  tails_gallons numeric(8,4),
  spirits_produced_proof_gallons numeric(10,4),
  transaction_date date not null,
  entry_timestamp timestamptz default now(),
  is_late_entry boolean default false,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  constraint distillation_no_neg check (spirits_produced_proof_gallons is null or spirits_produced_proof_gallons >= 0)
);
alter table distillation_logs enable row level security;
create policy "distillation_logs_distillery" on distillation_logs for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));
create index if not exists idx_distillation_logs_distillery on distillation_logs(distillery_id, distillation_date desc);

create table if not exists account_transfers (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  from_account text not null check (from_account in ('production','storage','processing')),
  to_account text not null check (to_account in ('storage','processing','taxpaid')),
  transfer_date date not null,
  spirits_type text not null,
  proof_gallons numeric(10,4) not null,
  wine_gallons numeric(10,4),
  barrel_ids uuid[],
  notes text,
  transaction_date date not null,
  entry_timestamp timestamptz default now(),
  is_late_entry boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  constraint positive_transfer check (proof_gallons > 0)
);
alter table account_transfers enable row level security;
create policy "account_transfers_distillery" on account_transfers for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));
create index if not exists idx_account_transfers_distillery on account_transfers(distillery_id, transfer_date desc);
create index if not exists idx_account_transfers_accounts on account_transfers(distillery_id, from_account, to_account);

-- ── Processing account ─────────────────────────────────────────────────────────

create table if not exists bottling_records (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  bottling_date date not null,
  product_name text not null,
  spirits_type text not null,
  barrel_ids uuid[],
  bottle_size_ml numeric(6,2) not null,
  bottles_per_case integer not null default 12,
  cases_bottled integer not null,
  proof numeric(6,3) not null,
  -- computed: cases * bottles_per_case * bottle_size_ml / 3785.41
  wine_gallons numeric(10,4),
  proof_gallons numeric(10,4),
  lot_number text,
  transaction_date date not null,
  entry_timestamp timestamptz default now(),
  is_late_entry boolean default false,
  notes text,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  constraint bottling_no_neg check (cases_bottled > 0 and proof > 0)
);
alter table bottling_records enable row level security;
create policy "bottling_records_distillery" on bottling_records for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));
create index if not exists idx_bottling_records_distillery on bottling_records(distillery_id, bottling_date desc);

create table if not exists remnant_area_log (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  log_date date not null,
  product_name text not null,
  bottles_count integer not null,
  estimated_proof_gallons numeric(8,4),
  disposition text check (disposition in ('on_hand','destroyed','returned_to_processing','other')),
  notes text,
  transaction_date date not null,
  entry_timestamp timestamptz default now(),
  is_late_entry boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table remnant_area_log enable row level security;
create policy "remnant_area_log_distillery" on remnant_area_log for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

create table if not exists leaker_area_log (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  log_date date not null,
  product_name text not null,
  leakers_count integer not null,
  estimated_proof_gallons_lost numeric(8,4),
  disposition text check (disposition in ('destroyed','returned_to_processing','other')),
  destruction_witnessed_by text,
  notes text,
  transaction_date date not null,
  entry_timestamp timestamptz default now(),
  is_late_entry boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table leaker_area_log enable row level security;
create policy "leaker_area_log_distillery" on leaker_area_log for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));
