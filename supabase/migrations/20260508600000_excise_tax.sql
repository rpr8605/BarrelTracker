-- Phase 5: Excise Tax Engine

create table if not exists tax_determined_removals (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  removal_date date not null,
  product_name text not null,
  spirits_type text not null,
  destination text not null check (destination in ('distributor','retailer','tasting_room','gift_shop','export','other')),
  cases_removed integer not null check (cases_removed > 0),
  bottles_per_case integer not null default 12,
  bottle_size_ml numeric(6,2) not null,
  proof numeric(6,3) not null,
  wine_gallons numeric(10,4) not null check (wine_gallons >= 0),
  proof_gallons numeric(10,4) not null check (proof_gallons >= 0),
  cbma_rate_applied numeric(5,2) not null check (cbma_rate_applied in (2.70, 13.50)),
  tax_owed numeric(10,2) not null,
  tax_period text not null, -- 'YYYY-MM-1' or 'YYYY-MM-2'
  bottling_record_id uuid references bottling_records(id),
  notes text,
  transaction_date date not null,
  entry_timestamp timestamptz default now(),
  is_late_entry boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now()
);
alter table tax_determined_removals enable row level security;
create policy "tax_removals_distillery" on tax_determined_removals for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));
create index if not exists idx_tax_removals_distillery_date on tax_determined_removals(distillery_id, removal_date desc);
create index if not exists idx_tax_removals_period on tax_determined_removals(distillery_id, tax_period);
create index if not exists idx_tax_removals_year on tax_determined_removals(distillery_id, extract(year from removal_date));
