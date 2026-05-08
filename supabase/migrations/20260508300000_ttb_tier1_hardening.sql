-- Tier 1 hardening: gauge record fields, ttb_report_periods, business-day columns

-- 1. Gauge record missing fields
alter table gauge_records
  add column if not exists gauge_time time,
  add column if not exists container_type text check (container_type in ('barrel','tank','bottling_tank','tote')),
  add column if not exists employee_title text,
  add column if not exists is_amended boolean default false,
  add column if not exists amends_gauge_id uuid references gauge_records(id),
  add column if not exists fill_temperature_f numeric(5,2);

-- Immutability: no updates or deletes on gauge records (corrections must use amend)
drop policy if exists "Users can update gauge records" on gauge_records;
drop policy if exists "Users can delete gauge records" on gauge_records;

-- 2. Barrel fill temperature + tare weight
alter table barrels
  add column if not exists fill_temperature_f numeric(5,2),
  add column if not exists tare_weight_lbs numeric(8,2),
  add column if not exists cooperage_locked boolean default false;

-- 3. ttb_report_periods — stores filed period snapshots for continuity checks
create table if not exists ttb_report_periods (
  id uuid primary key default gen_random_uuid(),
  distillery_id uuid not null references distilleries(id) on delete cascade,
  report_month date not null,  -- first of month: 2025-01-01
  form_5110_40_values jsonb,   -- {line_1..line_23_on_hand_end, submitted_at, confirmation_number}
  form_5110_11_values jsonb,   -- {line_1..line_24_on_hand_end, submitted_at, confirmation_number}
  form_5110_28_values jsonb,   -- {line_1..line_on_hand_end, submitted_at, confirmation_number}
  status text not null default 'draft' check (status in ('draft','filed')),
  filed_at timestamptz,
  confirmation_number text,
  notes text,
  created_at timestamptz default now(),
  unique(distillery_id, report_month)
);
alter table ttb_report_periods enable row level security;
create policy "Users access own report periods"
  on ttb_report_periods for all
  using (distillery_id in (select id from distilleries where owner_id = auth.uid()));

-- 4. transaction_date + is_late_entry on transactional tables
-- barrel_events
alter table barrel_events
  add column if not exists transaction_date date,
  add column if not exists is_late_entry boolean default false;

-- gauge_records
alter table gauge_records
  add column if not exists transaction_date date,
  add column if not exists is_late_entry boolean default false;

-- production_logs
alter table production_logs
  add column if not exists transaction_date date,
  add column if not exists is_late_entry boolean default false;

-- processing_logs
alter table processing_logs
  add column if not exists transaction_date date,
  add column if not exists is_late_entry boolean default false;

-- 5. Inventory attestations: add missing spec fields
alter table inventory_attestations
  add column if not exists signed_by_title text,
  add column if not exists perjury_statement text,
  add column if not exists ip_address text,
  add column if not exists pdf_path text,
  add column if not exists pdf_generated_at timestamptz,
  add column if not exists discrepancy_noted boolean default false,
  add column if not exists discrepancy_notes text;
