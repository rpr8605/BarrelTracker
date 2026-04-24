-- Add geolocation columns to barrels
alter table barrels
  add column if not exists latitude numeric(10, 8),
  add column if not exists longitude numeric(11, 8),
  add column if not exists location_accuracy_m numeric,
  add column if not exists location_captured_at timestamptz,
  add column if not exists location_label text;
