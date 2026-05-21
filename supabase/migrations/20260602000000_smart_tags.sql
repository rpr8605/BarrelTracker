-- Still Smart Tags: Asset tagging, compliance records, and scan tracking

-- 1. asset_tags
create table if not exists asset_tags (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  public_slug text unique not null,
  tag_url text not null,
  tag_type text not null check (tag_type in ('qr', 'nfc', 'uhf', 'hybrid')),
  nfc_uid text,
  uhf_epc text,
  assigned_entity_type text not null check (assigned_entity_type in ('product', 'batch', 'barrel', 'bottle', 'case', 'pallet', 'compliance_record', 'other')),
  assigned_entity_id uuid,
  status text not null default 'draft' check (status in ('draft', 'printed', 'written', 'verified', 'active', 'retired', 'lost', 'damaged')),
  public_enabled boolean default true,
  regulator_view_enabled boolean default true,
  internal_required boolean default false,
  printed_label_template_id uuid, -- will link to label_templates later
  written_at timestamptz,
  written_by uuid references auth.users(id),
  verified_at timestamptz,
  verified_by uuid references auth.users(id),
  last_scanned_at timestamptz,
  scan_count integer default 0,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table asset_tags enable row level security;

create policy "members_read_asset_tags" on asset_tags for select
  using (distillery_id in (select distilleries_i_can_access()) or (public_enabled = true));

create policy "writers_insert_asset_tags" on asset_tags for insert
  with check (distillery_id in (select distilleries_i_can_write()));

create policy "writers_update_asset_tags" on asset_tags for update
  using (distillery_id in (select distilleries_i_can_write()));

create policy "writers_delete_asset_tags" on asset_tags for delete
  using (distillery_id in (select distilleries_i_can_write()));

-- 2. tag_scan_events
create table if not exists tag_scan_events (
  id uuid primary key default gen_random_uuid(),
  asset_tag_id uuid references asset_tags(id) on delete cascade,
  scanned_at timestamptz default now(),
  scan_source text check (scan_source in ('qr', 'nfc', 'uhf', 'manual')),
  viewer_type text check (viewer_type in ('public', 'internal', 'distributor', 'regulator', 'unknown')),
  user_id uuid references auth.users(id),
  ip_address text,
  user_agent text,
  referrer text,
  location_hint text,
  action_taken text,
  metadata jsonb
);

alter table tag_scan_events enable row level security;

-- Scan events are mostly append-only for internal tracking
create policy "members_read_scan_events" on tag_scan_events for select
  using (asset_tag_id in (select id from asset_tags where distillery_id in (select distilleries_i_can_access())));

create policy "public_insert_scan_events" on tag_scan_events for insert
  with check (true); -- Allow anyone to record a scan event

-- 3. compliance_documents
create table if not exists compliance_documents (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  entity_type text not null check (entity_type in ('product', 'batch', 'barrel', 'bottle', 'case', 'pallet')),
  entity_id uuid not null,
  document_type text not null check (document_type in ('ttb_cola', 'state_registration', 'label_image', 'formula', 'distributor_agreement', 'sell_sheet', 'price_sheet', 'abc_correspondence', 'other')),
  title text not null,
  file_url text,
  external_url text,
  state text,
  document_number text,
  status text,
  uploaded_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table compliance_documents enable row level security;

create policy "members_read_compliance_docs" on compliance_documents for select
  using (distillery_id in (select distilleries_i_can_access()));

create policy "writers_manage_compliance_docs" on compliance_documents for all
  using (distillery_id in (select distilleries_i_can_write()));

-- 4. cola_records
create table if not exists cola_records (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  entity_type text not null,
  entity_id uuid not null,
  ttb_cola_number text,
  ttb_cola_registry_url text,
  status text,
  approval_date date,
  brand_name text,
  class_type text,
  label_version text,
  last_verified_at timestamptz,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table cola_records enable row level security;

create policy "members_read_cola" on cola_records for select
  using (distillery_id in (select distilleries_i_can_access()));

create policy "writers_manage_cola" on cola_records for all
  using (distillery_id in (select distilleries_i_can_write()));

-- 5. state_registrations
create table if not exists state_registrations (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  entity_type text not null,
  entity_id uuid not null,
  state text not null,
  agency_name text,
  registration_number text,
  status text check (status in ('not_started', 'submitted', 'approved', 'rejected', 'renewal_due', 'expired')),
  submitted_at date,
  approved_at date,
  expires_at date,
  renewal_due_at date,
  fee_status text,
  distributor_required boolean,
  distributor_name text,
  wholesaler_assignment text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table state_registrations enable row level security;

create policy "members_read_state_reg" on state_registrations for select
  using (distillery_id in (select distilleries_i_can_access()));

create policy "writers_manage_state_reg" on state_registrations for all
  using (distillery_id in (select distilleries_i_can_write()));

-- 6. control_state_codes
create table if not exists control_state_codes (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  entity_type text not null,
  entity_id uuid not null,
  nabca_code text,
  state text,
  state_item_code text,
  size_ml integer,
  pack_size text,
  status text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table control_state_codes enable row level security;

create policy "members_read_control_codes" on control_state_codes for select
  using (distillery_id in (select distilleries_i_can_access()));

create policy "writers_manage_control_codes" on control_state_codes for all
  using (distillery_id in (select distilleries_i_can_write()));

-- 7. label_templates
create table if not exists label_templates (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid references distilleries(id) on delete cascade not null,
  name text not null,
  template_type text not null check (template_type in ('barrel', 'product', 'batch', 'case', 'bottle', 'pallet')),
  description text,
  dimensions_json jsonb,
  fields_json jsonb,
  is_default boolean default false,
  created_by uuid references auth.users(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table label_templates enable row level security;

create policy "members_read_templates" on label_templates for select
  using (distillery_id in (select distilleries_i_can_access()));

create policy "writers_manage_templates" on label_templates for all
  using (distillery_id in (select distilleries_i_can_write()));

-- 8. tag_audit_events
create table if not exists tag_audit_events (
  id uuid primary key default gen_random_uuid(),
  asset_tag_id uuid references asset_tags(id) on delete cascade,
  event_type text not null,
  actor_id uuid references auth.users(id),
  message text,
  metadata jsonb,
  created_at timestamptz default now()
);

alter table tag_audit_events enable row level security;

create policy "members_read_audit" on tag_audit_events for select
  using (asset_tag_id in (select id from asset_tags where distillery_id in (select distilleries_i_can_access())));

-- Link asset_tags to label_templates
alter table asset_tags
  add constraint asset_tags_printed_label_template_id_fkey
  foreign key (printed_label_template_id)
  references label_templates(id);

-- RPC: Increment tag scan count
create or replace function increment_tag_scan_count(tag_id uuid)
returns void as $$
begin
  update asset_tags
  set scan_count = scan_count + 1,
      last_scanned_at = now()
  where id = tag_id;
end;
$$ language plpgsql security definer;
