-- Fix gauge_records RLS: SELECT + INSERT only. Amends go through service client.
-- Drop the FOR ALL write policy and replace with INSERT-only.
drop policy if exists "gauge_distillery_write" on gauge_records;

create policy "gauge_distillery_insert"
  on gauge_records for insert
  with check (distillery_id in (
    select id from distilleries where owner_id = auth.uid()
  ));

-- No UPDATE or DELETE policies — corrections must use the amend endpoint (service client)

-- Tier 1 hardening columns (idempotent — IF NOT EXISTS throughout)
alter table gauge_records
  add column if not exists gauge_time time,
  add column if not exists container_type text check (container_type in ('barrel','tank','bottling_tank','tote')),
  add column if not exists employee_title text,
  add column if not exists is_amended boolean default false,
  add column if not exists amends_gauge_id uuid references gauge_records(id),
  add column if not exists fill_temperature_f numeric(5,2),
  add column if not exists transaction_date date,
  add column if not exists is_late_entry boolean default false;

alter table barrels
  add column if not exists fill_temperature_f numeric(5,2),
  add column if not exists tare_weight_lbs numeric(8,2),
  add column if not exists cooperage_locked boolean default false;

create table if not exists ttb_report_periods (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  report_month date not null,
  form_5110_40_values jsonb,
  form_5110_11_values jsonb,
  form_5110_28_values jsonb,
  status text not null default 'draft' check (status in ('draft','filed')),
  filed_at timestamptz,
  confirmation_number text,
  notes text,
  created_at timestamptz default now(),
  unique(distillery_id, report_month)
);
alter table ttb_report_periods enable row level security;

drop policy if exists "Users access own report periods" on ttb_report_periods;
create policy "Users access own report periods"
  on ttb_report_periods for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

alter table barrel_events
  add column if not exists transaction_date date,
  add column if not exists is_late_entry boolean default false;

alter table production_logs
  add column if not exists transaction_date date,
  add column if not exists is_late_entry boolean default false;

alter table processing_logs
  add column if not exists transaction_date date,
  add column if not exists is_late_entry boolean default false;

alter table inventory_attestations
  add column if not exists signed_by_title text,
  add column if not exists perjury_statement text,
  add column if not exists ip_address text,
  add column if not exists pdf_path text,
  add column if not exists pdf_generated_at timestamptz,
  add column if not exists discrepancy_noted boolean default false,
  add column if not exists discrepancy_notes text;
