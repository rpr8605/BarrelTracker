-- Phase 6: COLA records and Formula records

CREATE TABLE IF NOT EXISTS formula_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distillery_id UUID NOT NULL REFERENCES distilleries(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  spirit_class TEXT NOT NULL,
  formula_required BOOLEAN NOT NULL DEFAULT true,
  formula_triggers TEXT[] DEFAULT '{}',
  ingredients JSONB DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'not_submitted' CHECK (
    status IN ('not_required','not_submitted','submitted','approved','rejected')
  ),
  submission_date DATE,
  approval_date DATE,
  formula_number TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  previous_version_id UUID REFERENCES formula_records(id),
  change_description TEXT,
  approval_file_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE formula_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "formula_records_distillery" ON formula_records FOR ALL
  USING (distillery_id IN (SELECT id FROM distilleries WHERE owner_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_formula_records_distillery ON formula_records(distillery_id);

CREATE TABLE IF NOT EXISTS cola_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  distillery_id UUID NOT NULL REFERENCES distilleries(id) ON DELETE CASCADE,
  product_name TEXT NOT NULL,
  brand_name TEXT NOT NULL,
  spirit_class TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pre_application' CHECK (
    status IN ('pre_application','submitted','approved','rejected','amendment_needed')
  ),
  application_date DATE,
  ttb_tracking_number TEXT,
  approval_date DATE,
  cola_number TEXT,
  submission_method TEXT CHECK (submission_method IN ('colas_online','mail')),
  label_checklist JSONB NOT NULL DEFAULT '{
    "brand_name_on_front": false,
    "class_type_designation": false,
    "abv_on_front_label": false,
    "abv_within_03_pct": false,
    "net_contents_metric": false,
    "name_and_address": false,
    "health_warning_statement": false
  }',
  formula_record_id UUID REFERENCES formula_records(id),
  label_file_path TEXT,
  approval_file_path TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE cola_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cola_records_distillery" ON cola_records FOR ALL
  USING (distillery_id IN (SELECT id FROM distilleries WHERE owner_id = auth.uid()));
CREATE INDEX IF NOT EXISTS idx_cola_records_distillery ON cola_records(distillery_id);
