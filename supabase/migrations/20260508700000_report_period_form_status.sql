-- Add per-form submission status columns to ttb_report_periods
-- Allows tracking which of the 3 forms has been submitted to TTB Online

ALTER TABLE ttb_report_periods
  ADD COLUMN IF NOT EXISTS form_5110_40_status text DEFAULT 'pending' CHECK (form_5110_40_status IN ('pending','submitted')),
  ADD COLUMN IF NOT EXISTS form_5110_40_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS form_5110_40_confirmation text,
  ADD COLUMN IF NOT EXISTS form_5110_11_status text DEFAULT 'pending' CHECK (form_5110_11_status IN ('pending','submitted')),
  ADD COLUMN IF NOT EXISTS form_5110_11_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS form_5110_11_confirmation text,
  ADD COLUMN IF NOT EXISTS form_5110_28_status text DEFAULT 'pending' CHECK (form_5110_28_status IN ('pending','submitted')),
  ADD COLUMN IF NOT EXISTS form_5110_28_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS form_5110_28_confirmation text,
  ADD COLUMN IF NOT EXISTS form_5000_24_status text DEFAULT 'pending' CHECK (form_5000_24_status IN ('pending','submitted')),
  ADD COLUMN IF NOT EXISTS form_5000_24_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS form_5000_24_confirmation text;
