create table if not exists subscriptions (
  id uuid primary key default uuid_generate_v4(),
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
