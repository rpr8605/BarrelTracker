-- Fix RLS policies that used owner_id-only checks.
-- All data tables should allow access via distilleries_i_can_access() / distilleries_i_can_write()
-- so non-owner team members with user_roles entries can read/write their distillery data.

-- ─── ttb_report_periods ──────────────────────────────────────────────────────
drop policy if exists "Users access own report periods" on ttb_report_periods;

create policy "members_read_report_periods" on ttb_report_periods for select
  using (distillery_id in (select distilleries_i_can_access()));

create policy "writers_insert_report_periods" on ttb_report_periods for insert
  with check (distillery_id in (select distilleries_i_can_write()));

create policy "writers_update_report_periods" on ttb_report_periods for update
  using (distillery_id in (select distilleries_i_can_write()));

create policy "writers_delete_report_periods" on ttb_report_periods for delete
  using (distillery_id in (select distilleries_i_can_write()));

-- ─── dsp_counterparties ──────────────────────────────────────────────────────
drop policy if exists "dsp_counterparties_read" on dsp_counterparties;
drop policy if exists "dsp_counterparties_write" on dsp_counterparties;

create policy "members_read_dsp_counterparties" on dsp_counterparties for select
  using (distillery_id in (select distilleries_i_can_access()));

create policy "writers_insert_dsp_counterparties" on dsp_counterparties for insert
  with check (distillery_id in (select distilleries_i_can_write()));

create policy "writers_update_dsp_counterparties" on dsp_counterparties for update
  using (distillery_id in (select distilleries_i_can_write()));

create policy "writers_delete_dsp_counterparties" on dsp_counterparties for delete
  using (distillery_id in (select distilleries_i_can_write()));

-- ─── tib_records ─────────────────────────────────────────────────────────────
drop policy if exists "tib_records_read" on tib_records;
drop policy if exists "tib_records_write" on tib_records;

create policy "members_read_tib_records" on tib_records for select
  using (distillery_id in (select distilleries_i_can_access()));

create policy "writers_insert_tib_records" on tib_records for insert
  with check (distillery_id in (select distilleries_i_can_write()));

create policy "writers_update_tib_records" on tib_records for update
  using (distillery_id in (select distilleries_i_can_write()));

create policy "writers_delete_tib_records" on tib_records for delete
  using (distillery_id in (select distilleries_i_can_write()));

-- ─── dsp_documents ───────────────────────────────────────────────────────────
drop policy if exists "dsp_documents_read" on dsp_documents;
drop policy if exists "dsp_documents_write" on dsp_documents;

create policy "members_read_dsp_documents" on dsp_documents for select
  using (distillery_id in (select distilleries_i_can_access()));

create policy "writers_insert_dsp_documents" on dsp_documents for insert
  with check (distillery_id in (select distilleries_i_can_write()));

create policy "writers_update_dsp_documents" on dsp_documents for update
  using (distillery_id in (select distilleries_i_can_write()));

create policy "writers_delete_dsp_documents" on dsp_documents for delete
  using (distillery_id in (select distilleries_i_can_write()));

-- ─── amendment_alerts ────────────────────────────────────────────────────────
drop policy if exists "amendment_alerts_read" on amendment_alerts;
drop policy if exists "amendment_alerts_write" on amendment_alerts;

create policy "members_read_amendment_alerts" on amendment_alerts for select
  using (distillery_id in (select distilleries_i_can_access()));

create policy "writers_insert_amendment_alerts" on amendment_alerts for insert
  with check (distillery_id in (select distilleries_i_can_write()));

create policy "writers_update_amendment_alerts" on amendment_alerts for update
  using (distillery_id in (select distilleries_i_can_write()));

create policy "writers_delete_amendment_alerts" on amendment_alerts for delete
  using (distillery_id in (select distilleries_i_can_write()));
