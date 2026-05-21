-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- DISTILLERIES
create table if not exists distilleries (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  location text,
  owner_id uuid references auth.users(id) on delete cascade not null,
  created_at timestamptz default now()
);

alter table distilleries enable row level security;
create policy "owner_all" on distilleries for all using (owner_id = auth.uid());

-- BATCHES (referenced by barrels)
create table if not exists batches (
  id uuid primary key default uuid_generate_v4(),
  distillery_id uuid references distilleries(id) on delete cascade,
  batch_number text,
  barrel_ids uuid[],
  blend_ratios jsonb,
  projected_flavor_profile text,
  bottle_count integer,
  yield_gallons numeric,
  cost_per_bottle numeric,
  bottled_date date,
  story_page_slug text unique,
  story_page_public boolean default false,
  story_content text,
  created_at timestamptz default now()
);

alter table batches enable row level security;
create policy "distillery_owner_all" on batches for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

-- BARRELS
create table if not exists barrels (
  id uuid primary key default uuid_generate_v4(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  barrel_number text not null,
  mash_bill text,
  grain_type text[],
  distillery_source text,
  entry_date date,
  entry_proof numeric,
  current_proof_estimate numeric,
  warehouse_row text,
  warehouse_slot integer,
  warehouse_tier integer,
  status text default 'aging' check (status in ('aging','ready','bottled','dumped')),
  finish_type text default 'none',
  nfc_tag_id text unique,
  tags text[],
  photos text[],
  angels_share_pct numeric default 0,
  predicted_peak_date date,
  profile_match_score numeric default 0,
  batch_id uuid references batches(id),
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(distillery_id, barrel_number)
);

alter table barrels enable row level security;
create policy "distillery_owner_all" on barrels for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

-- Enable realtime
alter publication supabase_realtime add table barrels;

-- VOICE NOTES
create table if not exists voice_notes (
  id uuid primary key default uuid_generate_v4(),
  barrel_id uuid references barrels(id) on delete cascade,
  distillery_id uuid references distilleries(id) on delete cascade,
  audio_url text,
  transcript text,
  ai_extracted_tags text[],
  ai_extracted_flavors jsonb,
  recorded_at timestamptz default now(),
  duration_seconds integer
);

alter table voice_notes enable row level security;
create policy "distillery_owner_all" on voice_notes for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

alter publication supabase_realtime add table voice_notes;

-- TASTE PROFILE
create table if not exists taste_profile (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique,
  grain_scores jsonb default '{}',
  flavor_scores jsonb default '{}',
  aging_sweet_spot_months jsonb default '{"min":24,"max":36}',
  approved_barrel_ids uuid[],
  rejected_barrel_ids uuid[],
  total_tastings integer default 0,
  last_updated timestamptz default now()
);

alter table taste_profile enable row level security;
create policy "own_profile" on taste_profile for all using (user_id = auth.uid());

-- ENVIRONMENTAL LOGS
create table if not exists environmental_logs (
  id uuid primary key default uuid_generate_v4(),
  distillery_id uuid references distilleries(id) on delete cascade,
  warehouse_zone text,
  temperature_f numeric,
  humidity_pct numeric,
  logged_at timestamptz default now()
);

alter table environmental_logs enable row level security;
create policy "distillery_owner_all" on environmental_logs for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

-- TAG LIBRARY (public read, admin write)
create table if not exists tag_library (
  id uuid primary key default uuid_generate_v4(),
  tag text unique not null,
  category text check (category in ('grain','distillery','finish','flavor','status','source')),
  aliases text[],
  usage_count integer default 0
);

alter table tag_library enable row level security;
create policy "public_read" on tag_library for select using (true);
create policy "auth_insert" on tag_library for insert with check (auth.uid() is not null);
create policy "auth_update" on tag_library for update using (auth.uid() is not null);

-- TTB REPORT PERIODS
create table if not exists ttb_report_periods (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  report_month date not null,
  form_5110_40_values jsonb,
  form_5110_11_values jsonb,
  form_5110_28_values jsonb,
  form_5000_24_values jsonb,
  status text not null default 'draft' check (status in ('draft','filed')),
  filed_at timestamptz,
  confirmation_number text,
  notes text,
  created_at timestamptz default now(),
  unique(distillery_id, report_month)
);

alter table ttb_report_periods enable row level security;
create policy "distillery_owner_all" on ttb_report_periods for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

-- Auto-update barrels.updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger barrels_updated_at before update on barrels
  for each row execute function update_updated_at();
