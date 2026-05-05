create extension if not exists "pgcrypto";

create table if not exists bottles (
  id uuid primary key default uuid_generate_v4(),
  batch_id uuid references batches(id) on delete cascade not null,
  distillery_id uuid references distilleries(id) on delete cascade not null,
  bottle_number integer not null,
  qr_token text unique not null default encode(gen_random_bytes(16), 'hex'),
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
