-- USER PROFILES (username + display name)
create table if not exists user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  display_name text not null,
  created_at timestamptz default now()
);

alter table user_profiles enable row level security;
create policy "profiles_public_read" on user_profiles for select using (true);
create policy "profiles_own_update" on user_profiles for update using (auth.uid() = id);
create policy "profiles_own_insert" on user_profiles for insert with check (auth.uid() = id);

-- USER ROLES (links users to distilleries with a role)
create table if not exists user_roles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  distillery_id uuid references distilleries(id) on delete cascade not null,
  role text not null check (role in ('read_only', 'full_access')),
  created_at timestamptz default now(),
  unique(user_id, distillery_id)
);

alter table user_roles enable row level security;

-- Any member of a distillery can see roles for that distillery
create policy "members_read_roles" on user_roles for select
  using (
    user_id = auth.uid()
    or distillery_id in (select id from distilleries where owner_id = auth.uid())
  );

-- Only distillery owners can manage roles
create policy "owners_manage_roles" on user_roles for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

-- Helper functions for RLS (security definer so they can read other tables)
create or replace function distilleries_i_can_access()
returns setof uuid language sql security definer stable as $$
  select id from distilleries where owner_id = auth.uid()
  union
  select distillery_id from user_roles where user_id = auth.uid()
$$;

create or replace function distilleries_i_can_write()
returns setof uuid language sql security definer stable as $$
  select id from distilleries where owner_id = auth.uid()
  union
  select distillery_id from user_roles where user_id = auth.uid() and role = 'full_access'
$$;

-- Allow non-owners to read their distillery
create policy "members_read_distillery" on distilleries for select
  using (
    owner_id = auth.uid()
    or id in (select distillery_id from user_roles where user_id = auth.uid())
  );

-- BARRELS — split read vs write policies
drop policy if exists "distillery_owner_all" on barrels;
create policy "members_read_barrels" on barrels for select
  using (distillery_id in (select distilleries_i_can_access()));
create policy "writers_insert_barrels" on barrels for insert
  with check (distillery_id in (select distilleries_i_can_write()));
create policy "writers_update_barrels" on barrels for update
  using (distillery_id in (select distilleries_i_can_write()));
create policy "writers_delete_barrels" on barrels for delete
  using (distillery_id in (select distilleries_i_can_write()));

-- BATCHES
drop policy if exists "distillery_owner_all" on batches;
create policy "members_read_batches" on batches for select
  using (distillery_id in (select distilleries_i_can_access()));
create policy "writers_insert_batches" on batches for insert
  with check (distillery_id in (select distilleries_i_can_write()));
create policy "writers_update_batches" on batches for update
  using (distillery_id in (select distilleries_i_can_write()));
create policy "writers_delete_batches" on batches for delete
  using (distillery_id in (select distilleries_i_can_write()));

-- VOICE NOTES
drop policy if exists "distillery_owner_all" on voice_notes;
create policy "members_read_notes" on voice_notes for select
  using (distillery_id in (select distilleries_i_can_access()));
create policy "writers_insert_notes" on voice_notes for insert
  with check (distillery_id in (select distilleries_i_can_write()));
create policy "writers_update_notes" on voice_notes for update
  using (distillery_id in (select distilleries_i_can_write()));
create policy "writers_delete_notes" on voice_notes for delete
  using (distillery_id in (select distilleries_i_can_write()));

-- ENVIRONMENTAL LOGS
drop policy if exists "distillery_owner_all" on environmental_logs;
create policy "members_read_env" on environmental_logs for select
  using (distillery_id in (select distilleries_i_can_access()));
create policy "writers_insert_env" on environmental_logs for insert
  with check (distillery_id in (select distilleries_i_can_write()));
create policy "writers_update_env" on environmental_logs for update
  using (distillery_id in (select distilleries_i_can_write()));
create policy "writers_delete_env" on environmental_logs for delete
  using (distillery_id in (select distilleries_i_can_write()));

-- TTB REPORTS
drop policy if exists "distillery_owner_all" on ttb_reports;
create policy "members_read_ttb" on ttb_reports for select
  using (distillery_id in (select distilleries_i_can_access()));
create policy "writers_insert_ttb" on ttb_reports for insert
  with check (distillery_id in (select distilleries_i_can_write()));
create policy "writers_update_ttb" on ttb_reports for update
  using (distillery_id in (select distilleries_i_can_write()));
create policy "writers_delete_ttb" on ttb_reports for delete
  using (distillery_id in (select distilleries_i_can_write()));
