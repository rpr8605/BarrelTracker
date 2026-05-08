# TTB Schema Reference
*Last updated: 2026-05-08*

One section per compliance-relevant database table. For non-compliance tables see CONTEXT.md.

---

## barrel_events

**TTB form:** 5110.11 (storage received/removed totals), 5110.40 (production transfers)
**27 CFR:** 19.571, 19.591

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | gen_random_uuid() |
| barrel_id | uuid FK → barrels | NOT NULL |
| distillery_id | uuid FK → distilleries | NOT NULL |
| event_type | text | CHECK IN (fill, transfer_in, transfer_out, gain, loss, bottling, dump) |
| wine_gallons | numeric | NOT NULL — always positive; sign determined by event_type |
| proof | numeric | nullable |
| proof_gallons | numeric | nullable — auto-calculated by events endpoint |
| notes | text | |
| occurred_at | timestamptz | NOT NULL default now() |
| transaction_date | date | For TTB record date (may differ from occurred_at) |
| is_late_entry | boolean | default false — set when entry > next business day deadline |
| created_by | uuid FK → auth.users | |
| created_at | timestamptz | |

**Foreign keys:** barrel_id → barrels(id) CASCADE, distillery_id → distilleries(id) CASCADE, created_by → auth.users(id)

**RLS:** enabled
- SELECT: barrel_events_distillery_read — distillery_id in distilleries_i_can_access()
- ALL: barrel_events_distillery_write — distillery_id in distilleries_i_can_write()

**Indexes:** idx_barrel_events_barrel (barrel_id), idx_barrel_events_distillery_period (distillery_id, occurred_at)

**Known gaps:**
- proof_gallons nullable — reconcile route recalculates when null; consider making NOT NULL with a trigger
- No NUMERIC(10,4) precision spec on proof_gallons

---

## compliance_snapshots

**TTB form:** 5110.11 (primary source for storage account line items), feeds 5110.40 beginning balances
**27 CFR:** 19.591

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| distillery_id | uuid FK → distilleries | NOT NULL |
| period | date | NOT NULL — first of month: 2025-01-01 |
| spirits_type | text | NOT NULL default bourbon |
| beg_wine_gallons | numeric | default 0 |
| beg_proof_gallons | numeric | default 0 |
| received_wine_gallons | numeric | default 0 |
| received_proof_gallons | numeric | default 0 |
| removed_wine_gallons | numeric | default 0 |
| removed_proof_gallons | numeric | default 0 |
| end_wine_gallons | numeric | default 0 |
| end_proof_gallons | numeric | default 0 |
| discrepancy_wine_gallons | numeric | default 0 — physical vs. ledger variance |
| barrel_count | integer | default 0 |
| status | text | CHECK IN (draft, filed) |
| generated_at | timestamptz | |
| filed_at | timestamptz | |

**Unique:** (distillery_id, period, spirits_type)

**Foreign keys:** distillery_id → distilleries(id) CASCADE

**RLS:** enabled
- SELECT: snapshots_distillery_read — distillery_id in distilleries_i_can_access()
- ALL: snapshots_distillery_write — distillery_id in distilleries_i_can_write()

**Indexes:** idx_compliance_snapshots_distillery (distillery_id, period)

**Known gaps:**
- No CHECK (>= 0) on any gallon columns
- No NUMERIC precision spec — all gallons should be NUMERIC(10,4)
- Does not store proof-gallon beginning balance for production account separately (5110.40 beg balance taken from prior period end_proof_gallons aggregated across spirits_types)

---

## gauge_records

**TTB form:** 27 CFR 19.618 — required gauges. Feeds all three forms.
**Regulation:** 27 CFR 19.618 (gauge), 27 CFR 19.631 (3-year retention), 27 CFR 19.580 (next-business-day entry)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| distillery_id | uuid FK → distilleries | NOT NULL |
| barrel_id | uuid FK → barrels | nullable (tank gauges have no barrel) |
| gauge_type | text | NOT NULL CHECK IN (production, fill, bottling, regauge, post_tib, tamper) |
| container_id | text | NOT NULL — barrel number or tank ID |
| container_type | text | CHECK IN (barrel, tank, bottling_tank, tote) |
| gauged_at | timestamptz | NOT NULL — actual gauge moment |
| gauge_time | time | Time component if logged separately |
| transaction_date | date | TTB record date |
| is_late_entry | boolean | default false |
| temperature_f | numeric | NOT NULL |
| fill_temperature_f | numeric(5,2) | Temperature at fill |
| proof | numeric | NOT NULL |
| wine_gallons | numeric | NOT NULL |
| proof_gallons | numeric | NOT NULL — must equal wine_gallons × (proof/100) rounded to 4 decimals |
| gauge_officer | text | NOT NULL — name of gauging officer |
| employee_title | text | Title of gauging officer |
| cooperage_code | text | CHECK IN (C, REC, P, PAR, G, R, PS) |
| package_id | text | Package/lot identifier |
| gross_weight_lbs | numeric | |
| notes | text | |
| is_amended | boolean | default false — true means this record was superseded |
| amends_gauge_id | uuid FK → gauge_records | Self-reference to original record |
| created_by | uuid FK → auth.users | |
| created_at | timestamptz | |

**Foreign keys:** distillery_id → distilleries(id) CASCADE, barrel_id → barrels(id) SET NULL, amends_gauge_id → gauge_records(id), created_by → auth.users(id)

**RLS:** enabled — APPEND ONLY
- SELECT: gauge_distillery_read — distillery_id in distilleries_i_can_access()
- INSERT: gauge_distillery_insert — distillery_id in (SELECT id FROM distilleries WHERE owner_id = auth.uid())
- NO UPDATE policy — corrections via amend endpoint (service client only)
- NO DELETE policy

**Indexes:** idx_gauge_records_distillery (distillery_id, gauged_at), idx_gauge_records_barrel (barrel_id)

**Known gaps:**
- gauge_distillery_insert uses owner_id check — excludes staff via user_roles (inconsistent with read policy which uses distilleries_i_can_access())
- Amend endpoint bug: inserts employee_name (does not exist) and attested_by (does not exist) — should be gauge_officer and created_by
- types/database.ts GaugeRecord interface does not include Tier 1 hardening columns

---

## production_logs

**TTB form:** 5110.40 (Monthly Report of Production Operations)
**27 CFR:** 19.571

Wide flat table — one row per log_type event. All columns beyond common ones are sparse.

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| distillery_id | uuid FK → distilleries | NOT NULL |
| log_type | text | NOT NULL CHECK IN (mash_batch, fermentation, distillation, transfer_to_storage, production_loss) |
| batch_number | text | mash_batch |
| grain_bill | jsonb | mash_batch — {grain: lbs} |
| grain_quantity_lbs | numeric | mash_batch — total pounds |
| fermentation_start | date | fermentation |
| fermentation_end | date | fermentation |
| starting_gravity | numeric | fermentation |
| ending_gravity | numeric | fermentation |
| still_id | text | distillation |
| spirits_type | text | distillation |
| spirits_produced_proof_gallons | numeric | distillation |
| spirits_produced_wine_gallons | numeric | distillation |
| transfer_proof_gallons | numeric | transfer_to_storage |
| transfer_wine_gallons | numeric | transfer_to_storage |
| transfer_proof | numeric | transfer_to_storage |
| loss_proof_gallons | numeric | production_loss |
| loss_cause | text | production_loss |
| occurred_at | timestamptz | NOT NULL default now() |
| transaction_date | date | |
| is_late_entry | boolean | default false |
| notes | text | |
| created_by | uuid FK → auth.users | |
| created_at | timestamptz | |

**RLS:** enabled
- SELECT: production_logs_read — distillery_id in distilleries_i_can_access()
- ALL: production_logs_write — distillery_id in distilleries_i_can_write()

**Indexes:** idx_production_logs_distillery (distillery_id, occurred_at)

**Known gaps:**
- Wide flat table design causes many NULL columns per row — Tier 2 will split into typed sub-tables
- No NUMERIC precision on proof_gallons fields
- No immutability enforcement (UPDATE/DELETE allowed)

---

## processing_logs

**TTB form:** 5110.28 (Monthly Report of Processing Operations)
**27 CFR:** 19.601

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| distillery_id | uuid FK → distilleries | NOT NULL |
| log_type | text | NOT NULL CHECK IN (bottling_run, remnant, leaker, tax_removal, processing_receipt, processing_loss) |
| spirits_type | text | |
| product_name | text | |
| proof | numeric | |
| wine_gallons | numeric | |
| proof_gallons | numeric | |
| bottles_filled | integer | bottling_run |
| bottle_size_ml | numeric | bottling_run |
| case_count | integer | bottling_run |
| removal_type | text | tax_removal CHECK IN (tasting_room, retail, wholesale, export) |
| loss_cause | text | processing_loss CHECK IN (breakage, leaker, spillage, evaporation, other) |
| occurred_at | timestamptz | NOT NULL default now() |
| transaction_date | date | |
| is_late_entry | boolean | default false |
| notes | text | |
| created_by | uuid FK → auth.users | |
| created_at | timestamptz | |

**RLS:** enabled
- SELECT: processing_logs_read
- ALL: processing_logs_write

**Indexes:** idx_processing_logs_distillery (distillery_id, occurred_at)

**Known gaps:**
- Same wide flat table issue as production_logs
- No immutability enforcement

---

## inventory_attestations

**TTB form:** Physical inventory requirement
**27 CFR:** 19.623 (physical inventory), 19.631 (3-year retention)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| distillery_id | uuid FK → distilleries | NOT NULL |
| inventory_type | text | NOT NULL CHECK IN (quarterly_storage, semi_annual_processing) |
| period_label | text | NOT NULL — human-readable e.g. "Q1 2026" |
| inventory_date | date | NOT NULL |
| total_proof_gallons | numeric | default 0 |
| barrel_count | integer | |
| container_count | integer | |
| inventory_data | jsonb | default [] — array of InventoryItem objects |
| attested_by_name | text | NOT NULL |
| attested_by_user_id | uuid FK → auth.users | |
| attested_at | timestamptz | |
| status | text | CHECK IN (draft, attested) |
| signed_by_title | text | Title of signing officer |
| perjury_statement | text | Full CFR perjury statement text |
| ip_address | text | Client IP at time of attestation |
| pdf_path | text | R2 URL or local-uploads path |
| pdf_generated_at | timestamptz | |
| discrepancy_noted | boolean | default false |
| discrepancy_notes | text | |
| created_at | timestamptz | |

**Foreign keys:** distillery_id → distilleries(id) CASCADE, attested_by_user_id → auth.users(id)

**RLS:** enabled
- SELECT: inventory_attestations_read
- ALL: inventory_attestations_write (note: UPDATE is permitted — unlike gauge_records; correction by update is allowed for attestations)

**Indexes:** idx_inventory_attestations_distillery (distillery_id, inventory_date)

**Known gaps:**
- total_wine_gallons column does not exist — POST handler passes 0 hardcoded to PDF generator
- inventory_data items should conform to InventoryItem interface from lib/ttb/inventory-pdf.ts
- No server-side validation that perjury_statement matches the verbatim CFR text

---

## ttb_report_periods

**TTB form:** All three forms — stores the filed line-item values for continuity checking
**27 CFR:** 19.580 (monthly reports)

| Column | Type | Notes |
|--------|------|-------|
| id | uuid PK | |
| distillery_id | uuid NOT NULL FK → distilleries | |
| report_month | date | NOT NULL — first of month: 2025-01-01 |
| form_5110_40_values | jsonb | {line_23_on_hand_end, submitted_at, confirmation_number, source?, imported_at?} |
| form_5110_11_values | jsonb | {line_24_on_hand_end, submitted_at, confirmation_number, source?, imported_at?} |
| form_5110_28_values | jsonb | {line_on_hand_end, submitted_at, confirmation_number, source?, imported_at?} |
| status | text | NOT NULL CHECK IN (draft, filed) default draft |
| filed_at | timestamptz | |
| confirmation_number | text | TTB Online confirmation number |
| notes | text | |
| created_at | timestamptz | |

**Unique:** (distillery_id, report_month)

**Foreign keys:** distillery_id → distilleries(id) CASCADE

**RLS:** enabled
- ALL: Users access own report periods — distillery_id in (SELECT id FROM distilleries WHERE owner_id = auth.uid())

**Known gaps:**
- RLS policy uses owner_id check only — staff members with user_roles access cannot read/write. Fix: change to use distilleries_i_can_access() helper or add OR clause for user_roles
- No index beyond implicit unique constraint — add explicit index on (distillery_id, report_month) for query performance

---

## barrels (TTB-relevant columns only)

Full table definition in CONTEXT.md. TTB-specific columns:

| Column | Type | Notes |
|--------|------|-------|
| wine_gallons | numeric | Original fill volume |
| current_wine_gallons | numeric | Running volume (updated by events endpoint) |
| spirits_type | text | CHECK IN (bourbon, tennessee_whiskey, ...) |
| warehouse_account | text | NOT NULL default bonded |
| cooperage_code | text | CHECK IN (C, REC, P, PAR, G, R, PS) |
| gross_weight_lbs | numeric | |
| fill_temperature_f | numeric(5,2) | |
| tare_weight_lbs | numeric(8,2) | |
| cooperage_locked | boolean | default false — prevent cooperage edits after first gauge |
| entry_proof | numeric | Used for proof_gallon calculations |

**Known gaps:**
- No DB-level CHECK (entry_proof <= 125) for bourbon
- No DB-level cooperage enforcement (bourbon=C, corn_whiskey!=C) — app-layer only via validateCooperage()
- Proof gallons not stored directly on barrel; all calculations on demand

---

## Notes on TTB form line number mappings

### Form 5110.11 — Monthly Report of Storage Operations
From compliance_snapshots per spirits_type:
- Line 1 (Beginning on hand): beg_proof_gallons
- Line 2 (Received from production): received_proof_gallons
- Line 5 (Transferred to processing): removed_proof_gallons
- Line 10 (Ending on hand): end_proof_gallons
- Barrel package summary from barrels table (27 CFR 19.591)

### Form 5110.40 — Monthly Report of Production Operations
From production_logs:
- Mash batch count from log_type = mash_batch
- Distillation runs and proof gallons produced from log_type = distillation
- Transfers to storage from log_type = transfer_to_storage
- Production losses from log_type = production_loss

### Form 5110.28 — Monthly Report of Processing Operations
From processing_logs:
- Receipts from storage: log_type = processing_receipt
- Bottling: log_type = bottling_run (bottles, cases, proof gallons)
- Tax-determined removals: log_type = tax_removal (with removal_type)
- Losses: log_type = processing_loss
- Remnants: log_type = remnant
- Leakers: log_type = leaker
