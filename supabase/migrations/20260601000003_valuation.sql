-- Feature 4: Barrel valuation + insurance report

create table if not exists valuation_rates (
  id uuid default gen_random_uuid() primary key,
  spirit_type text not null,
  age_min_months integer default 0,
  age_max_months integer,
  rate_per_gallon numeric(10,2) not null,
  notes text,
  updated_at timestamptz default now()
);

-- Seed default rates
insert into valuation_rates (spirit_type, age_min_months, age_max_months, rate_per_gallon) values
  ('Bourbon', 0, 24, 8.00),
  ('Bourbon', 24, 48, 14.00),
  ('Bourbon', 48, 72, 22.00),
  ('Bourbon', 72, null, 35.00),
  ('Rye', 0, 24, 7.50),
  ('Rye', 24, 48, 13.00),
  ('Rye', 48, null, 20.00),
  ('Malt Whiskey', 0, 36, 9.00),
  ('Malt Whiskey', 36, null, 18.00),
  ('Rum', 0, 36, 6.00),
  ('Rum', 36, null, 12.00),
  ('Other', 0, null, 6.00)
on conflict do nothing;

create table if not exists valuation_snapshots (
  id uuid default gen_random_uuid() primary key,
  distillery_id uuid references distilleries(id) on delete cascade not null,
  generated_at timestamptz default now(),
  total_value numeric(12,2),
  barrel_count integer,
  total_gallons numeric(10,2),
  generated_by uuid references auth.users(id),
  pdf_url text
);

alter table valuation_rates enable row level security;
alter table valuation_snapshots enable row level security;

create policy "anyone_read_rates" on valuation_rates for select using (true);
create policy "members_read_snap" on valuation_snapshots for select using (distillery_id in (select distilleries_i_can_access()));
create policy "writers_write_snap" on valuation_snapshots for all using (distillery_id in (select distilleries_i_can_write()));

create index if not exists idx_valuation_snap_dist on valuation_snapshots(distillery_id, generated_at desc);
