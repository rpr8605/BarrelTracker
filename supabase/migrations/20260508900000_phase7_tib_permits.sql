-- Phase 7: TIB Records, DSP Permits, Counterparties, Amendment Alerts

-- DSP counterparties (trading partners for TIB transfers)
create table if not exists dsp_counterparties (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  counterparty_name text not null,
  dsp_number text not null,
  address text,
  contact_name text,
  contact_email text,
  contact_phone text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table dsp_counterparties enable row level security;

create policy "dsp_counterparties_read" on dsp_counterparties for select
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

create policy "dsp_counterparties_write" on dsp_counterparties for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

create index if not exists idx_dsp_counterparties_distillery on dsp_counterparties(distillery_id);

-- TIB transfer records (27 CFR 19.402 — Transfer in Bond)
create table if not exists tib_records (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  serial_number text not null,
  direction text not null check (direction in ('inbound', 'outbound')),
  counterparty_id uuid references dsp_counterparties(id),
  counterparty_dsp_number text not null,
  counterparty_name text not null,
  spirits_type text not null,
  wine_gallons numeric(10,4) not null check (wine_gallons >= 0),
  proof numeric(6,2) not null check (proof >= 0 and proof <= 200),
  proof_gallons numeric(10,4) generated always as (round(wine_gallons * (proof / 100.0), 4)) stored,
  transfer_date date not null,
  barrel_ids uuid[],
  container_description text,
  ttb_form_5100_16_serial text,
  notes text,
  status text not null default 'pending' check (status in ('pending','in_transit','received','cancelled')),
  received_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(distillery_id, serial_number)
);

alter table tib_records enable row level security;

create policy "tib_records_read" on tib_records for select
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

create policy "tib_records_write" on tib_records for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

create index if not exists idx_tib_records_distillery on tib_records(distillery_id, transfer_date);
create index if not exists idx_tib_records_serial on tib_records(distillery_id, serial_number);

-- DSP permits, bonds, and official documents
create table if not exists dsp_documents (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  document_type text not null check (document_type in (
    'basic_permit','dsp_registration','operating_bond','tib_bond',
    'formula_approval','label_approval','other'
  )),
  document_number text,
  title text not null,
  issue_date date,
  expiration_date date,
  issuing_authority text not null default 'TTB',
  status text not null default 'active' check (status in ('active','expired','superseded','pending')),
  r2_key text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table dsp_documents enable row level security;

create policy "dsp_documents_read" on dsp_documents for select
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

create policy "dsp_documents_write" on dsp_documents for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

create index if not exists idx_dsp_documents_distillery on dsp_documents(distillery_id);
create index if not exists idx_dsp_documents_expiration on dsp_documents(distillery_id, expiration_date);

-- Amendment and action alerts
create table if not exists amendment_alerts (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  alert_type text not null check (alert_type in (
    'first_tib_inbound','permit_expiring','permit_expired',
    'filed_period_record_edited','bond_renewal'
  )),
  title text not null,
  description text,
  related_id uuid,
  related_type text,
  status text not null default 'pending' check (status in ('pending','acknowledged','resolved')),
  severity text not null default 'warning' check (severity in ('info','warning','critical')),
  created_at timestamptz default now(),
  acknowledged_at timestamptz,
  resolved_at timestamptz
);

alter table amendment_alerts enable row level security;

create policy "amendment_alerts_read" on amendment_alerts for select
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

create policy "amendment_alerts_write" on amendment_alerts for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

create index if not exists idx_amendment_alerts_distillery on amendment_alerts(distillery_id, status);
create index if not exists idx_amendment_alerts_pending on amendment_alerts(distillery_id) where status = 'pending';
