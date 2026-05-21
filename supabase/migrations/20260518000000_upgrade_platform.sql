-- Upgrade Platform Migration: 20260518000000
-- Includes Production, Blending, NPD, and Advanced Roles

-- 1. UPDATE USER ROLES CONSTRAINT
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE user_roles ADD CONSTRAINT user_roles_role_check 
  CHECK (role IN ('owner', 'admin', 'production_manager', 'compliance_reviewer', 'finance_reviewer', 'consultant', 'read_only_stakeholder', 'read_only', 'full_access'));

-- 2. CREATE NEW TABLES

-- RAW MATERIAL LOTS
CREATE TABLE raw_material_lots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  material_name text NOT NULL,
  source text,
  lot_number text,
  quantity numeric NOT NULL,
  unit text NOT NULL, -- kg, lbs, gal, etc
  cost numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- PRODUCTION BATCHES
CREATE TABLE production_batches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  batch_name text NOT NULL,
  start_date date,
  end_date date,
  status text CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- FERMENTATION BATCHES
CREATE TABLE fermentation_batches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  production_batch_id uuid REFERENCES production_batches(id) ON DELETE CASCADE NOT NULL,
  yeast_type text,
  gravity_og numeric,
  gravity_fg numeric,
  temp_log jsonb DEFAULT '[]',
  status text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- DISTILLATION RUNS
CREATE TABLE distillation_runs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  production_batch_id uuid REFERENCES production_batches(id) ON DELETE CASCADE NOT NULL,
  still_id text,
  run_number text,
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- DISTILLATION CUTS
CREATE TABLE distillation_cuts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  run_id uuid REFERENCES distillation_runs(id) ON DELETE CASCADE NOT NULL,
  cut_type text CHECK (cut_type IN ('heads', 'hearts', 'tails')),
  volume_gallons numeric,
  proof numeric,
  destination_id uuid, -- holding tank or barrel
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- HOLDING TANKS
CREATE TABLE holding_tanks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  tank_name text NOT NULL,
  capacity_gallons numeric,
  current_volume_gallons numeric DEFAULT 0,
  current_proof numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- BLEND BATCHES
CREATE TABLE blend_batches (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  blend_name text NOT NULL,
  target_proof numeric,
  target_volume_gallons numeric,
  status text CHECK (status IN ('draft', 'active', 'bottled')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- BLEND BATCH COMPONENTS
CREATE TABLE blend_batch_components (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  blend_batch_id uuid REFERENCES blend_batches(id) ON DELETE CASCADE NOT NULL,
  source_type text CHECK (source_type IN ('barrel', 'holding_tank')),
  source_id uuid NOT NULL,
  volume_gallons numeric NOT NULL,
  proof numeric NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- PROOFING ADJUSTMENTS
CREATE TABLE proofing_adjustments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  source_type text CHECK (source_type IN ('tank', 'blend')),
  source_id uuid NOT NULL,
  water_added_gallons numeric NOT NULL,
  pre_proof numeric,
  post_proof numeric,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- BOTTLING RUNS
CREATE TABLE bottling_runs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  blend_batch_id uuid REFERENCES blend_batches(id) ON DELETE CASCADE NOT NULL,
  bottling_date date,
  bottle_size_ml numeric,
  bottle_count integer,
  label_name text,
  tasting_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- FINISHED GOODS LOTS
CREATE TABLE finished_goods_lots (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  bottling_run_id uuid REFERENCES bottling_runs(id) ON DELETE CASCADE NOT NULL,
  sku text,
  lot_number text,
  quantity_cases integer,
  warehouse_location text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- FINISHED GOODS MOVEMENTS
CREATE TABLE finished_goods_movements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  lot_id uuid REFERENCES finished_goods_lots(id) ON DELETE CASCADE NOT NULL,
  movement_type text CHECK (movement_type IN ('sale', 'transfer', 'adjustment')),
  quantity_cases integer NOT NULL,
  destination text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- NPD PROJECTS
CREATE TABLE npd_projects (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  project_name text NOT NULL,
  category text,
  target_proof numeric,
  status text CHECK (status IN ('concept', 'pilot', 'approved', 'archived')),
  ai_brief text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- NPD VERSIONS
CREATE TABLE npd_versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  project_id uuid REFERENCES npd_projects(id) ON DELETE CASCADE NOT NULL,
  version_number text NOT NULL,
  formula_notes text,
  cost_estimate numeric,
  sensory_notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- CONSULTANT REVIEWS
CREATE TABLE consultant_reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  distillery_id uuid REFERENCES distilleries(id) ON DELETE CASCADE NOT NULL,
  target_type text NOT NULL, -- ttb_report, formula, label, release
  target_id uuid NOT NULL,
  reviewer_id uuid REFERENCES auth.users(id),
  status text CHECK (status IN ('pending', 'approved', 'needs_revision')),
  comments text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

-- 3. ENABLE RLS AND APPLY POLICIES

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'raw_material_lots', 'production_batches', 'fermentation_batches', 
    'distillation_runs', 'distillation_cuts', 'holding_tanks', 
    'blend_batches', 'blend_batch_components', 'proofing_adjustments', 
    'bottling_runs', 'finished_goods_lots', 'finished_goods_movements', 
    'npd_projects', 'npd_versions', 'consultant_reviews'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    
    EXECUTE format('CREATE POLICY members_read_%s ON %I FOR SELECT USING (distillery_id IN (SELECT distilleries_i_can_access()))', t, t);
    EXECUTE format('CREATE POLICY writers_insert_%s ON %I FOR INSERT WITH CHECK (distillery_id IN (SELECT distilleries_i_can_write()))', t, t);
    EXECUTE format('CREATE POLICY writers_update_%s ON %I FOR UPDATE USING (distillery_id IN (SELECT distilleries_i_can_write()))', t, t);
    EXECUTE format('CREATE POLICY writers_delete_%s ON %I FOR DELETE USING (distillery_id IN (SELECT distilleries_i_can_write()))', t, t);
  END LOOP;
END $$;

-- 4. ADD UPDATED_AT TRIGGERS

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'raw_material_lots', 'production_batches', 'fermentation_batches', 
    'distillation_runs', 'distillation_cuts', 'holding_tanks', 
    'blend_batches', 'blend_batch_components', 'proofing_adjustments', 
    'bottling_runs', 'finished_goods_lots', 'finished_goods_movements', 
    'npd_projects', 'npd_versions', 'consultant_reviews'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('CREATE TRIGGER %I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()', t, t);
  END LOOP;
END $$;
