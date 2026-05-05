-- Consumer profiles (auth.users for public consumers, separate from staff)
create table if not exists consumer_profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade unique,
  display_name text not null,
  avatar_url text,
  bio text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table consumer_profiles enable row level security;
create policy "consumer_profiles_public_read" on consumer_profiles for select using (true);
create policy "consumer_profiles_own_write" on consumer_profiles for all using (auth.uid() = user_id);

-- Tasting notes submitted by consumers
create table if not exists tasting_notes (
  id uuid primary key default uuid_generate_v4(),
  consumer_id uuid references consumer_profiles(id) on delete cascade not null,
  bottle_id uuid references bottles(id) on delete set null,
  barrel_id uuid references barrels(id) on delete set null,
  batch_id uuid references batches(id) on delete set null,
  distillery_id uuid references distilleries(id) on delete cascade not null,
  rating integer check (rating >= 1 and rating <= 5),
  notes text,
  flavor_tags text[],
  created_at timestamptz default now()
);
alter table tasting_notes enable row level security;
create policy "tasting_notes_public_read" on tasting_notes for select using (true);
create policy "tasting_notes_own_write" on tasting_notes for all using (
  auth.uid() = (select user_id from consumer_profiles where id = consumer_id)
);
create policy "distillery_read_notes" on tasting_notes for select
  using (distillery_id in (select distilleries_i_can_access()));

-- Barrel adoptions
create table if not exists adoptions (
  id uuid primary key default uuid_generate_v4(),
  consumer_id uuid references consumer_profiles(id) on delete cascade not null,
  barrel_id uuid references barrels(id) on delete cascade not null,
  distillery_id uuid references distilleries(id) on delete cascade not null,
  bottle_id uuid references bottles(id) on delete set null,
  tier text not null check (tier in ('full', 'share')),
  share_number integer,
  price_paid numeric not null default 0,
  stripe_payment_intent text,
  status text not null default 'active' check (status in ('active', 'fulfilled', 'canceled')),
  adopted_at timestamptz default now()
);
alter table adoptions enable row level security;
create policy "adoptions_own_read" on adoptions for select
  using (auth.uid() = (select user_id from consumer_profiles where id = consumer_id));
create policy "adoptions_own_write" on adoptions for insert
  using (auth.uid() = (select user_id from consumer_profiles where id = consumer_id));
create policy "distillery_read_adoptions" on adoptions for select
  using (distillery_id in (select distilleries_i_can_access()));

-- Notification subscriptions (consumers following a barrel for updates)
create table if not exists notification_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  consumer_id uuid references consumer_profiles(id) on delete cascade not null,
  barrel_id uuid references barrels(id) on delete cascade,
  distillery_id uuid references distilleries(id) on delete cascade,
  type text not null check (type in ('bottling', 'milestone', 'drop', 'release')),
  email text,
  push_endpoint text,
  created_at timestamptz default now(),
  unique(consumer_id, barrel_id, type)
);
alter table notification_subscriptions enable row level security;
create policy "notif_own" on notification_subscriptions for all using (
  auth.uid() = (select user_id from consumer_profiles where id = consumer_id)
);

-- Drop events (limited releases)
create table if not exists drop_events (
  id uuid primary key default uuid_generate_v4(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  barrel_id uuid references barrels(id) on delete set null,
  batch_id uuid references batches(id) on delete set null,
  title text not null,
  description text,
  total_bottles integer not null default 0,
  bottles_remaining integer not null default 0,
  price_per_bottle numeric not null default 0,
  opens_at timestamptz not null,
  closes_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'waitlist', 'open', 'sold_out', 'closed')),
  created_at timestamptz default now()
);
alter table drop_events enable row level security;
create policy "drop_events_public_read" on drop_events for select using (status != 'draft');
create policy "drop_events_distillery_all" on drop_events for all
  using (distillery_id in (select distilleries_i_can_write()));

create table if not exists drop_waitlist (
  id uuid primary key default uuid_generate_v4(),
  drop_event_id uuid references drop_events(id) on delete cascade not null,
  consumer_id uuid references consumer_profiles(id) on delete cascade,
  email text,
  joined_at timestamptz default now(),
  position integer,
  unique(drop_event_id, consumer_id)
);
alter table drop_waitlist enable row level security;
create policy "drop_waitlist_own" on drop_waitlist for all using (
  consumer_id is null or auth.uid() = (select user_id from consumer_profiles where id = consumer_id)
);

create table if not exists drop_purchases (
  id uuid primary key default uuid_generate_v4(),
  drop_event_id uuid references drop_events(id) on delete cascade not null,
  consumer_id uuid references consumer_profiles(id) on delete cascade,
  bottle_count integer not null default 1,
  stripe_payment_intent text,
  purchased_at timestamptz default now()
);
alter table drop_purchases enable row level security;
create policy "drop_purchases_own" on drop_purchases for select using (
  consumer_id is null or auth.uid() = (select user_id from consumer_profiles where id = consumer_id)
);

-- Distillery public profile pages
create table if not exists distillery_pages (
  id uuid primary key default uuid_generate_v4(),
  distillery_id uuid references distilleries(id) on delete cascade not null unique,
  slug text unique not null,
  headline text,
  story text,
  hero_image_url text,
  instagram_url text,
  veteran_org text,
  donation_percentage numeric default 0,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table distillery_pages enable row level security;
create policy "distillery_pages_public_read" on distillery_pages for select using (published = true);
create policy "distillery_pages_owner_all" on distillery_pages for all
  using (distillery_id in (select distilleries_i_can_write()));

-- Veterans Whiskey Trail
create table if not exists trails (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  logo_url text,
  created_at timestamptz default now()
);
alter table trails enable row level security;
create policy "trails_public_read" on trails for select using (true);

create table if not exists trail_stops (
  id uuid primary key default uuid_generate_v4(),
  trail_id uuid references trails(id) on delete cascade not null,
  distillery_id uuid references distilleries(id) on delete cascade,
  stop_number integer not null,
  name text not null,
  location text,
  experience_type text not null check (experience_type in ('barrel_scan', 'tasting_challenge', 'veteran_story', 'cocktail_reveal')),
  experience_config jsonb default '{}',
  qr_token text unique not null default encode(gen_random_bytes(16), 'hex'),
  created_at timestamptz default now()
);
alter table trail_stops enable row level security;
create policy "trail_stops_public_read" on trail_stops for select using (true);

create table if not exists trail_passports (
  id uuid primary key default uuid_generate_v4(),
  consumer_id uuid references consumer_profiles(id) on delete cascade not null,
  trail_id uuid references trails(id) on delete cascade not null,
  started_at timestamptz default now(),
  completed_at timestamptz,
  unique(consumer_id, trail_id)
);
alter table trail_passports enable row level security;
create policy "trail_passports_own" on trail_passports for all using (
  auth.uid() = (select user_id from consumer_profiles where id = consumer_id)
);
create policy "trail_passports_public_read" on trail_passports for select using (true);

create table if not exists trail_checkins (
  id uuid primary key default uuid_generate_v4(),
  passport_id uuid references trail_passports(id) on delete cascade not null,
  stop_id uuid references trail_stops(id) on delete cascade not null,
  checked_in_at timestamptz default now(),
  experience_completed boolean default false,
  unique(passport_id, stop_id)
);
alter table trail_checkins enable row level security;
create policy "trail_checkins_own" on trail_checkins for all using (
  auth.uid() = (select user_id from consumer_profiles cp join trail_passports tp on tp.consumer_id = cp.id where tp.id = passport_id)
);
create policy "trail_checkins_public_read" on trail_checkins for select using (true);

-- Badge system
create table if not exists badges (
  id uuid primary key default uuid_generate_v4(),
  slug text unique not null,
  name text not null,
  description text,
  image_url text,
  category text not null check (category in ('trail', 'distillery', 'tasting', 'community', 'milestone')),
  criteria jsonb default '{}',
  created_at timestamptz default now()
);
alter table badges enable row level security;
create policy "badges_public_read" on badges for select using (true);

create table if not exists consumer_badges (
  id uuid primary key default uuid_generate_v4(),
  consumer_id uuid references consumer_profiles(id) on delete cascade not null,
  badge_id uuid references badges(id) on delete cascade not null,
  earned_at timestamptz default now(),
  context jsonb default '{}',
  unique(consumer_id, badge_id)
);
alter table consumer_badges enable row level security;
create policy "consumer_badges_public_read" on consumer_badges for select using (true);
create policy "consumer_badges_own_write" on consumer_badges for insert using (
  auth.uid() = (select user_id from consumer_profiles where id = consumer_id)
);

-- Follow system
create table if not exists follows (
  id uuid primary key default uuid_generate_v4(),
  consumer_id uuid references consumer_profiles(id) on delete cascade not null,
  entity_type text not null check (entity_type in ('distillery', 'barrel', 'consumer')),
  entity_id uuid not null,
  created_at timestamptz default now(),
  unique(consumer_id, entity_type, entity_id)
);
alter table follows enable row level security;
create policy "follows_public_read" on follows for select using (true);
create policy "follows_own_write" on follows for all using (
  auth.uid() = (select user_id from consumer_profiles where id = consumer_id)
);

-- Indexes for performance
create index if not exists idx_tasting_notes_consumer on tasting_notes(consumer_id);
create index if not exists idx_tasting_notes_barrel on tasting_notes(barrel_id);
create index if not exists idx_adoptions_consumer on adoptions(consumer_id);
create index if not exists idx_adoptions_barrel on adoptions(barrel_id);
create index if not exists idx_follows_consumer on follows(consumer_id);
create index if not exists idx_follows_entity on follows(entity_type, entity_id);
create index if not exists idx_trail_checkins_passport on trail_checkins(passport_id);
create index if not exists idx_consumer_badges_consumer on consumer_badges(consumer_id);
create index if not exists idx_drop_waitlist_drop on drop_waitlist(drop_event_id);
create index if not exists idx_notification_subscriptions_barrel on notification_subscriptions(barrel_id);
create index if not exists idx_bottles_batch on bottles(batch_id);
create index if not exists idx_bottles_qr_token on bottles(qr_token);
