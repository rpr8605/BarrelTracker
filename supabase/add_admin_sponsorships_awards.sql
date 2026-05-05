-- Phase 2: Admin CRM, Sponsorships, QR Events, Awards

-- Add super_admin flag to user_profiles
alter table user_profiles add column if not exists is_super_admin boolean default false;

-- Add branding/platform fields to distilleries
alter table distilleries add column if not exists slug text unique;
alter table distilleries add column if not exists brand_color text default '#BA7517';
alter table distilleries add column if not exists is_demo boolean default false;
alter table distilleries add column if not exists plan text default 'core' check (plan in ('core', 'story', 'trail', 'pro'));
alter table distilleries add column if not exists logo_url text;
alter table distilleries add column if not exists address text;
alter table distilleries add column if not exists lat numeric;
alter table distilleries add column if not exists lng numeric;

-- Add public token to barrels for QR story pages
alter table barrels add column if not exists public_token text unique default encode(gen_random_bytes(16), 'hex');
create index if not exists idx_barrels_public_token on barrels(public_token);

-- Nancy's CRM
create table if not exists crm_clients (
  id uuid primary key default uuid_generate_v4(),
  contact_name text not null,
  distillery_name text not null,
  email text,
  phone text,
  stage text not null default 'PROSPECT' check (stage in ('PROSPECT','DEMO_SCHEDULED','PROPOSAL_SENT','NEGOTIATION','ONBOARDING','ACTIVE','CHURNED')),
  notes text,
  mrr_cents integer,
  next_follow_up_at timestamptz,
  distillery_id uuid references distilleries(id) on delete set null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
alter table crm_clients enable row level security;
create policy "super_admin_all_crm" on crm_clients for all
  using ((select is_super_admin from user_profiles where id = auth.uid()) = true);

-- Sponsorship tiers for barrel story pages
create table if not exists sponsorships (
  id uuid primary key default uuid_generate_v4(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  barrel_id uuid references barrels(id) on delete cascade not null,
  consumer_id uuid references consumer_profiles(id) on delete set null,
  tier text not null check (tier in ('FOLLOWER','SUPPORTER','SPONSOR','PARTNER')),
  sponsor_name text not null,
  sponsor_email text,
  sponsor_logo_url text,
  stripe_payment_intent_id text,
  stripe_price_id text,
  amount_cents integer not null default 0,
  platform_fee_cents integer not null default 0,
  status text not null default 'PENDING' check (status in ('PENDING','ACTIVE','CANCELLED')),
  certificate_url text,
  is_gift boolean default false,
  gift_recipient_email text,
  starts_at timestamptz default now(),
  ends_at timestamptz,
  created_at timestamptz default now()
);
alter table sponsorships enable row level security;
create policy "sponsorships_public_read" on sponsorships for select using (status = 'ACTIVE');
create policy "sponsorships_consumer_read" on sponsorships for select
  using (consumer_id in (select id from consumer_profiles where user_id = auth.uid()));
create policy "sponsorships_distillery_read" on sponsorships for select
  using (distillery_id in (select distilleries_i_can_access()));
create policy "sponsorships_service_all" on sponsorships for all using (true);
create index if not exists idx_sponsorships_barrel on sponsorships(barrel_id);
create index if not exists idx_sponsorships_distillery on sponsorships(distillery_id);

-- QR scan events for analytics
create table if not exists barrel_qr_events (
  id uuid primary key default uuid_generate_v4(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  barrel_id uuid references barrels(id) on delete cascade not null,
  session_id text not null,
  state text not null check (state in ('PRE_CLAIM','CLAIMED','TRAIL_COMPLETE')),
  ip_hash text,
  user_agent text,
  referrer text,
  consumer_id uuid references consumer_profiles(id) on delete set null,
  scanned_at timestamptz default now()
);
alter table barrel_qr_events enable row level security;
create policy "qr_events_distillery_read" on barrel_qr_events for select
  using (distillery_id in (select distilleries_i_can_access()));
create policy "qr_events_super_admin_all" on barrel_qr_events for all
  using ((select is_super_admin from user_profiles where id = auth.uid()) = true);
create policy "qr_events_public_insert" on barrel_qr_events for insert with check (true);
create index if not exists idx_qr_events_barrel on barrel_qr_events(barrel_id);
create index if not exists idx_qr_events_scanned on barrel_qr_events(scanned_at);

-- Still Awards (data layer)
create table if not exists awards (
  id uuid primary key default uuid_generate_v4(),
  year integer not null,
  category text not null check (category in (
    'BEST_BOURBON','BEST_RYE','BEST_SINGLE_MALT','BEST_WHEAT','BEST_EXPERIMENTAL',
    'MOST_FOLLOWERS','TOP_DISTILLERY','BEST_STORY','BEST_COLLABORATION',
    'COMMUNITY_FAVORITE','COLLECTOR_OF_THE_YEAR'
  )),
  winner_type text check (winner_type in ('distillery','consumer','barrel')),
  winner_id uuid,
  winner_name text,
  vote_count integer default 0,
  announced_at timestamptz,
  created_at timestamptz default now(),
  unique(year, category)
);
alter table awards enable row level security;
create policy "awards_public_read" on awards for select using (true);
create policy "awards_super_admin_all" on awards for all
  using ((select is_super_admin from user_profiles where id = auth.uid()) = true);

create table if not exists award_votes (
  id uuid primary key default uuid_generate_v4(),
  consumer_id uuid references consumer_profiles(id) on delete cascade not null,
  award_id uuid references awards(id) on delete cascade not null,
  nominee_id uuid not null,
  nominee_name text not null,
  voted_at timestamptz default now(),
  unique(consumer_id, award_id)
);
alter table award_votes enable row level security;
create policy "award_votes_own" on award_votes for all
  using (auth.uid() = (select user_id from consumer_profiles where id = consumer_id));
create policy "award_votes_super_admin_read" on award_votes for select
  using ((select is_super_admin from user_profiles where id = auth.uid()) = true);
create index if not exists idx_award_votes_award on award_votes(award_id);

-- Notification log
create table if not exists notification_log (
  id uuid primary key default uuid_generate_v4(),
  consumer_id uuid references consumer_profiles(id) on delete cascade,
  distillery_id uuid references distilleries(id) on delete cascade,
  barrel_id uuid references barrels(id) on delete set null,
  type text not null check (type in ('BARREL_MILESTONE','SPONSORSHIP_UPDATE','TRAIL_PROGRESS','SYSTEM','AWARD')),
  payload jsonb default '{}',
  sent_at timestamptz default now(),
  opened_at timestamptz
);
alter table notification_log enable row level security;
create policy "notif_log_own" on notification_log for select
  using (consumer_id in (select id from consumer_profiles where user_id = auth.uid()));
create policy "notif_log_distillery_read" on notification_log for select
  using (distillery_id in (select distilleries_i_can_access()));
create index if not exists idx_notif_log_consumer on notification_log(consumer_id);
create index if not exists idx_notif_log_barrel on notification_log(barrel_id);
