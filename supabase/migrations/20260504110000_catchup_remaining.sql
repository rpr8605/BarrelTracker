create extension if not exists "pgcrypto";

create table if not exists bottles (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references batches(id) on delete cascade not null,
  distillery_id uuid references distilleries(id) on delete cascade not null,
  bottle_number integer not null,
  qr_token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  status text not null default 'in_inventory' check (status in ('in_inventory', 'sold', 'adopted', 'gifted')),
  current_owner_consumer_id uuid,
  notes text,
  created_at timestamptz default now(),
  unique(batch_id, bottle_number)
);

alter table bottles enable row level security;

-- Distillery staff can manage bottles
create policy "distillery_members_read_bottles" on bottles for select
  using (distillery_id in (select distilleries_i_can_access()));

create policy "distillery_writers_manage_bottles" on bottles for all
  using (distillery_id in (select distilleries_i_can_write()));

-- Public can look up a bottle by its QR token (for passport/story)
create policy "public_bottle_lookup" on bottles for select
  using (true);

-- Indexes
create index if not exists idx_bottles_batch on bottles(batch_id);
create index if not exists idx_bottles_qr_token on bottles(qr_token);
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text unique,
  plan text not null default 'core' check (plan in ('core', 'story', 'trail')),
  status text not null default 'active' check (status in ('active', 'trialing', 'past_due', 'canceled', 'incomplete')),
  current_period_end timestamptz,
  cancel_at_period_end boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "distillery_members_read_subscription" on subscriptions for select
  using (distillery_id in (select distilleries_i_can_access()));

create policy "service_role_all" on subscriptions for all
  using (true);
-- Add geolocation columns to barrels
alter table barrels
  add column if not exists latitude numeric(10, 8),
  add column if not exists longitude numeric(11, 8),
  add column if not exists location_accuracy_m numeric,
  add column if not exists location_captured_at timestamptz,
  add column if not exists location_label text;
-- Consumer profiles (auth.users for public consumers, separate from staff)
create table if not exists consumer_profiles (
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
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
  with check (auth.uid() = (select user_id from consumer_profiles where id = consumer_id));
create policy "distillery_read_adoptions" on adoptions for select
  using (distillery_id in (select distilleries_i_can_access()));

-- Notification subscriptions (consumers following a barrel for updates)
create table if not exists notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  logo_url text,
  created_at timestamptz default now()
);
alter table trails enable row level security;
create policy "trails_public_read" on trails for select using (true);

create table if not exists trail_stops (
  id uuid primary key default gen_random_uuid(),
  trail_id uuid references trails(id) on delete cascade not null,
  distillery_id uuid references distilleries(id) on delete cascade,
  stop_number integer not null,
  name text not null,
  location text,
  experience_type text not null check (experience_type in ('barrel_scan', 'tasting_challenge', 'veteran_story', 'cocktail_reveal')),
  experience_config jsonb default '{}',
  qr_token text unique not null default replace(gen_random_uuid()::text, '-', ''),
  created_at timestamptz default now()
);
alter table trail_stops enable row level security;
create policy "trail_stops_public_read" on trail_stops for select using (true);

create table if not exists trail_passports (
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
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
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid references consumer_profiles(id) on delete cascade not null,
  badge_id uuid references badges(id) on delete cascade not null,
  earned_at timestamptz default now(),
  context jsonb default '{}',
  unique(consumer_id, badge_id)
);
alter table consumer_badges enable row level security;
create policy "consumer_badges_public_read" on consumer_badges for select using (true);
create policy "consumer_badges_own_write" on consumer_badges for insert with check (
  auth.uid() = (select user_id from consumer_profiles where id = consumer_id)
);

-- Follow system
create table if not exists follows (
  id uuid primary key default gen_random_uuid(),
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
-- Veterans Whiskey Trail seed data
WITH trail AS (
  INSERT INTO trails (name, description)
  VALUES (
    'Veterans Whiskey Trail',
    'A journey through veteran-owned and veteran-supporting American craft distilleries.'
  )
  RETURNING id
)
INSERT INTO trail_stops (trail_id, stop_number, name, location, experience_type, experience_config)
SELECT
  trail.id,
  stops.stop_number,
  stops.name,
  stops.location,
  stops.experience_type,
  stops.experience_config
FROM trail,
(VALUES
  (
    1,
    '10th Mountain Whiskey & Spirit Co.',
    'Vail, CO',
    'veteran_story',
    '{"prompt":"Share what service means to you","story_title":"Mountain Division Legacy"}'::jsonb
  ),
  (
    2,
    'Willie''s Distillery',
    'Ennis, MT',
    'tasting_challenge',
    '{"challenge":"Identify the grain bill","answer_options":["Wheat","Rye","Corn","Barley"],"correct":"Wheat"}'::jsonb
  ),
  (
    3,
    'Larrikin Bourbon',
    'Bardstown, KY',
    'barrel_scan',
    '{"hint":"Find the oldest barrel in the rickhouse"}'::jsonb
  ),
  (
    4,
    'BHAWK Distillery',
    'Statesville, NC',
    'cocktail_reveal',
    '{"cocktail_name":"Black Hawk Old Fashioned","recipe":"2oz BHAWK bourbon, 1 sugar cube, 2 dashes Angostura, orange peel"}'::jsonb
  ),
  (
    5,
    'Desert Door Sotol',
    'Driftwood, TX',
    'tasting_challenge',
    '{"challenge":"Name the plant sotol is distilled from","answer_options":["Agave","Dasylirion","Yucca","Saguaro"],"correct":"Dasylirion"}'::jsonb
  )
) AS stops(stop_number, name, location, experience_type, experience_config);

-- Badges
INSERT INTO badges (slug, name, description, category, criteria) VALUES
  (
    'trail_veterans_complete',
    'Trail Complete',
    'Completed the full Veterans Whiskey Trail',
    'trail',
    '{"trail":"Veterans Whiskey Trail","stops_required":5}'
  ),
  (
    'trail_veterans_halfway',
    'Halfway There',
    'Completed 3 stops on the Veterans Whiskey Trail',
    'trail',
    '{"trail":"Veterans Whiskey Trail","stops_required":3}'
  ),
  (
    'first_checkin',
    'First Step',
    'Completed your first trail stop check-in',
    'milestone',
    '{"checkins":1}'
  ),
  (
    'tasting_5',
    'Tasting Apprentice',
    'Submitted 5 tasting notes',
    'tasting',
    '{"tasting_notes":5}'
  ),
  (
    'tasting_25',
    'Tasting Expert',
    'Submitted 25 tasting notes',
    'tasting',
    '{"tasting_notes":25}'
  ),
  (
    'follow_3',
    'Community Member',
    'Following 3 or more distilleries',
    'community',
    '{"follows":3}'
  ),
  (
    'adoption_first',
    'Barrel Patron',
    'Adopted your first barrel',
    'distillery',
    '{"adoptions":1}'
  )
ON CONFLICT (slug) DO NOTHING;
