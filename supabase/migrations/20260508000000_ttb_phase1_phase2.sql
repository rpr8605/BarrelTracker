-- TTB Phase 1 & 2: Proof-gallon accounting foundation

-- Extend barrels with TTB-required volume and classification fields
alter table barrels
  add column if not exists wine_gallons numeric,
  add column if not exists current_wine_gallons numeric,
  add column if not exists spirits_type text check (spirits_type in (
    'bourbon','tennessee_whiskey','rye_whiskey','wheat_whiskey','malt_whiskey',
    'corn_whiskey','neutral_spirits','brandy','rum','gin','tequila','other'
  )),
  add column if not exists warehouse_account text not null default 'bonded';

-- DSP registration number on the distillery
alter table distilleries
  add column if not exists dsp_number text;

-- Barrel event ledger: every volume change that must be reported to TTB
create table if not exists barrel_events (
  id uuid primary key default gen_random_uuid(),
  barrel_id uuid references barrels(id) on delete cascade not null,
  distillery_id uuid references distilleries(id) on delete cascade not null,
  event_type text not null check (event_type in (
    'fill','transfer_in','transfer_out','gain','loss','bottling','dump'
  )),
  wine_gallons numeric not null,
  proof numeric,
  proof_gallons numeric,
  notes text,
  occurred_at timestamptz not null default now(),
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);

alter table barrel_events enable row level security;

create policy "barrel_events_distillery_read" on barrel_events for select
  using (distillery_id in (select distilleries_i_can_access()));

create policy "barrel_events_distillery_write" on barrel_events for all
  using (distillery_id in (select distilleries_i_can_write()));

create index if not exists idx_barrel_events_barrel on barrel_events(barrel_id);
create index if not exists idx_barrel_events_distillery_period on barrel_events(distillery_id, occurred_at);

-- Monthly compliance snapshots: proof-gallon reconciliation per spirits type
create table if not exists compliance_snapshots (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  period date not null,
  spirits_type text not null default 'bourbon',
  beg_wine_gallons numeric not null default 0,
  beg_proof_gallons numeric not null default 0,
  received_wine_gallons numeric not null default 0,
  received_proof_gallons numeric not null default 0,
  removed_wine_gallons numeric not null default 0,
  removed_proof_gallons numeric not null default 0,
  end_wine_gallons numeric not null default 0,
  end_proof_gallons numeric not null default 0,
  discrepancy_wine_gallons numeric not null default 0,
  barrel_count integer not null default 0,
  status text not null default 'draft' check (status in ('draft','filed')),
  generated_at timestamptz default now(),
  filed_at timestamptz,
  unique(distillery_id, period, spirits_type)
);

alter table compliance_snapshots enable row level security;

create policy "snapshots_distillery_read" on compliance_snapshots for select
  using (distillery_id in (select distilleries_i_can_access()));

create policy "snapshots_distillery_write" on compliance_snapshots for all
  using (distillery_id in (select distilleries_i_can_write()));

create index if not exists idx_compliance_snapshots_distillery on compliance_snapshots(distillery_id, period);
