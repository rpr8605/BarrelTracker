-- Feature 3: Digital sensory + tasting log

create table if not exists tasting_sessions (
  id uuid default gen_random_uuid() primary key,
  distillery_id uuid references distilleries(id) on delete cascade not null,
  barrel_id uuid references barrels(id) on delete cascade not null,
  sampled_by uuid references auth.users(id),
  sampled_at timestamptz default now(),
  abv_at_sample numeric(5,2),
  color_description text,
  overall_score integer check (overall_score between 0 and 100),
  voice_note_url text,
  voice_note_transcript text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists tasting_notes (
  id uuid default gen_random_uuid() primary key,
  tasting_session_id uuid references tasting_sessions(id) on delete cascade not null,
  category text not null check (category in ('nose', 'palate', 'finish')),
  descriptors text[] default '{}',
  raw_notes text,
  created_at timestamptz default now()
);

alter table tasting_sessions enable row level security;
alter table tasting_notes enable row level security;

create policy "members_read_tasting"   on tasting_sessions for select using (distillery_id in (select distilleries_i_can_access()));
create policy "writers_write_tasting"  on tasting_sessions for all    using (distillery_id in (select distilleries_i_can_write()));

create policy "members_read_tnotes"  on tasting_notes for select using (
  tasting_session_id in (select id from tasting_sessions where distillery_id in (select distilleries_i_can_access()))
);
create policy "writers_write_tnotes" on tasting_notes for all using (
  tasting_session_id in (select id from tasting_sessions where distillery_id in (select distilleries_i_can_write()))
);

create trigger tasting_sessions_updated_at before update on tasting_sessions
  for each row execute function update_updated_at();

create index if not exists idx_tasting_barrel on tasting_sessions(barrel_id, sampled_at desc);
create index if not exists idx_tasting_notes_session on tasting_notes(tasting_session_id);
