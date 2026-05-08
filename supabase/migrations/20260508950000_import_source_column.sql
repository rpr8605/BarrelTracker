-- Add import_source to ttb_report_periods for historical import tracking
alter table ttb_report_periods
  add column if not exists import_source text check (import_source in ('manual','historical_import','api'));
