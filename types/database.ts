export interface Distillery {
  id: string
  name: string
  location: string | null
  owner_id: string
  created_at: string
}

export interface Barrel {
  id: string
  distillery_id: string
  barrel_number: string
  mash_bill: string | null
  grain_type: string[] | null
  distillery_source: string | null
  entry_date: string | null
  entry_proof: number | null
  current_proof_estimate: number | null
  warehouse_row: string | null
  warehouse_slot: number | null
  warehouse_tier: number | null
  status: 'aging' | 'ready' | 'bottled' | 'dumped'
  finish_type: string | null
  nfc_tag_id: string | null
  tags: string[] | null
  photos: string[] | null
  angels_share_pct: number | null
  predicted_peak_date: string | null
  profile_match_score: number | null
  batch_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface VoiceNote {
  id: string
  barrel_id: string
  distillery_id: string
  audio_url: string | null
  transcript: string | null
  ai_extracted_tags: string[] | null
  ai_extracted_flavors: FlavorExtraction[] | null
  recorded_at: string
  duration_seconds: number | null
}

export interface FlavorExtraction {
  name: string
  intensity: number
  confidence: number
}

export interface TasteProfile {
  id: string
  user_id: string
  grain_scores: Record<string, number>
  flavor_scores: Record<string, number>
  aging_sweet_spot_months: { min: number; max: number }
  approved_barrel_ids: string[] | null
  rejected_barrel_ids: string[] | null
  total_tastings: number
  last_updated: string
}

export interface Batch {
  id: string
  distillery_id: string
  batch_number: string | null
  barrel_ids: string[] | null
  blend_ratios: Record<string, number> | null
  projected_flavor_profile: string | null
  bottle_count: number | null
  yield_gallons: number | null
  cost_per_bottle: number | null
  bottled_date: string | null
  story_page_slug: string | null
  story_page_public: boolean
  story_content: string | null
  created_at: string
}

export interface EnvironmentalLog {
  id: string
  distillery_id: string
  warehouse_zone: string | null
  temperature_f: number | null
  humidity_pct: number | null
  logged_at: string
}

export interface TagLibraryEntry {
  id: string
  tag: string
  category: 'grain' | 'distillery' | 'finish' | 'flavor' | 'status' | 'source'
  aliases: string[] | null
  usage_count: number
}

export interface TtbReport {
  id: string
  distillery_id: string
  report_month: string
  report_data: Record<string, unknown> | null
  status: 'draft' | 'filed'
  generated_at: string
}
