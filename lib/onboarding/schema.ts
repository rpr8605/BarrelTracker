export type OnboardingStep = 1 | 2 | 3 | 4 | 5

export const STEP_LABELS: Record<OnboardingStep, string> = {
  1: 'Distillery Profile',
  2: 'DSP Registration',
  3: 'Bond Information',
  4: 'Compliance Stations',
  5: 'Barrel Defaults',
}

export const SPIRITS_OPTIONS = [
  'bourbon',
  'rye',
  'wheat_whiskey',
  'corn_whiskey',
  'malt_whiskey',
  'brandy',
  'rum',
  'gin',
  'vodka',
  'specialty',
] as const

export const OPERATIONS_TYPES = ['producer', 'warehouseman', 'processor'] as const

export const BOND_TYPES = ['operations', 'unit_bond', 'tax_deferral', 'waiver'] as const

export const ENTITY_TYPES = ['LLC', 'S-Corp', 'C-Corp', 'Sole Proprietor', 'Partnership', 'Non-Profit'] as const

export const COOPERAGE_CODES = ['C', 'REC', 'P', 'PAR', 'G', 'R', 'PS'] as const

export const COOPERAGE_LABELS: Record<string, string> = {
  C: 'New Charred Oak (TTB code C)',
  REC: 'Reused (REC)',
  P: 'Plain / new uncharred (P)',
  PAR: 'Paraffined (PAR)',
  G: 'Glass (G)',
  R: 'Reused barrel (R)',
  PS: 'Paraffined and seasoned (PS)',
}

export interface DistilleryProfileData {
  distillery_name: string
  trade_name?: string
  website?: string
  phone: string
  email: string
  founding_year?: number
  description?: string
  spirits_produced: string[]
  barrel_count_estimate?: number
  state: string
}

export interface DSPRegistrationData {
  dsp_number?: string
  dsp_permit_date?: string
  dsp_skipped?: boolean
  ein?: string
  entity_type?: string
  principal_name?: string
  principal_title?: string
  operations_type: string[]
  street_address?: string
  city?: string
  state?: string
  zip?: string
  county?: string
  mailing_same: boolean
  mailing_address?: string
  mailing_city?: string
  mailing_state?: string
  mailing_zip?: string
  plant_name?: string
  trade_name?: string
  spirits_categories?: string[]
}

export interface BondData {
  bond_type: 'operations' | 'unit_bond' | 'tax_deferral' | 'waiver'
  bond_number?: string
  surety_company?: string
  bond_amount?: number
  penal_sum?: number
  effective_date?: string
  expiration_date?: string
  renewal_required?: boolean
  notes?: string
}

export interface ProductionStationData {
  fermenter_count?: number
  fermenters: Array<{ id?: string; name: string; capacity_gallons: number; material: string }>
  typical_mash_size_gallons?: number
  typical_fermentation_days?: number
  stills: Array<{ id?: string; name: string; type: string; capacity_gallons: number }>
  water_source?: string
  grain_bill_templates: Array<{ name: string; grains: Array<{ type: string; percentage: number }> }>
  yeast_types: string[]
  proof_measurement_method?: string
}

export interface StorageStationData {
  warehouses: Array<{
    id?: string
    name: string
    building_number?: string
    type: string
    total_positions?: number
    rack_count?: number
    bays_per_rack?: number
    levels_per_bay?: number
  }>
  default_cooperage_code: string
  default_oak_origin?: string
  typical_barrel_sizes: Array<{ size_gallons: number; count?: number }>
  typical_entry_proof_min: number
  typical_entry_proof_max: number
  annual_evaporation_rate_pct: number
  package_number_prefix?: string
  package_number_sequence: number
  package_number_format: string
}

export interface ProcessingStationData {
  bottle_sizes: number[]
  cola_approvals: Array<{
    ttb_id?: string
    brand_name: string
    product_name: string
    class_type?: string
    alcohol_content?: number
    approved_date?: string
    status: 'Active' | 'Pending' | 'Expired'
  }>
  gauging_method: string
  operations: string[]
  typical_bottling_loss_pct: number
  annual_proof_gallons_estimate?: number
  tax_deferral_eligible: boolean
}

export interface BarrelDefaultsData {
  default_spirits_type?: string
  default_cooperage_code?: string
  default_grain_bill_template?: string
  default_entry_proof?: number
  default_warehouse?: string
  default_rack?: number
  auto_generate_serial: boolean
  require_nfc_on_entry: boolean
  nfc_choice?: 'have' | 'order' | 'skip'
}

export const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO',
  'MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC',
]
