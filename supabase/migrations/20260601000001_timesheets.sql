-- Feature 2: Timesheets + NFC staff clock-in

create table if not exists staff_members (
  id uuid default gen_random_uuid() primary key,
  distillery_id uuid references distilleries(id) on delete cascade not null,
  user_id uuid references auth.users(id),
  name text not null,
  role text,
  nfc_tag_id text unique,
  hourly_rate numeric(10,2),
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists time_entries (
  id uuid default gen_random_uuid() primary key,
  distillery_id uuid references distilleries(id) on delete cascade not null,
  staff_member_id uuid references staff_members(id) on delete cascade not null,
  clock_in timestamptz not null,
  clock_out timestamptz,
  notes text,
  nfc_verified boolean default false,
  approved_by uuid references auth.users(id),
  approved_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table staff_members enable row level security;
alter table time_entries enable row level security;

create policy "members_read_staff"  on staff_members for select using (distillery_id in (select distilleries_i_can_access()));
create policy "writers_write_staff" on staff_members for all    using (distillery_id in (select distilleries_i_can_write()));

create policy "members_read_time"   on time_entries  for select using (distillery_id in (select distilleries_i_can_access()));
create policy "writers_write_time"  on time_entries  for all    using (distillery_id in (select distilleries_i_can_write()));

create trigger staff_members_updated_at before update on staff_members
  for each row execute function update_updated_at();
create trigger time_entries_updated_at before update on time_entries
  for each row execute function update_updated_at();

create index if not exists idx_time_entries_staff_open on time_entries(staff_member_id) where clock_out is null;
create index if not exists idx_time_entries_distillery_clockin on time_entries(distillery_id, clock_in desc);
create index if not exists idx_staff_nfc on staff_members(nfc_tag_id) where nfc_tag_id is not null;
