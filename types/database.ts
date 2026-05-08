export interface Distillery {
  id: string
  name: string
  location: string | null
  owner_id: string
  dsp_number: string | null
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
  latitude: number | null
  longitude: number | null
  location_accuracy_m: number | null
  location_captured_at: string | null
  location_label: string | null
  notes: string | null
  wine_gallons: number | null
  current_wine_gallons: number | null
  spirits_type: string | null
  warehouse_account: string | null
  created_at: string
  updated_at: string
}

export interface BarrelEvent {
  id: string
  barrel_id: string
  distillery_id: string
  event_type: 'fill' | 'transfer_in' | 'transfer_out' | 'gain' | 'loss' | 'bottling' | 'dump'
  wine_gallons: number
  proof: number | null
  proof_gallons: number | null
  notes: string | null
  occurred_at: string
  created_by: string | null
  created_at: string
}

export interface ComplianceSnapshot {
  id: string
  distillery_id: string
  period: string
  spirits_type: string
  beg_wine_gallons: number
  beg_proof_gallons: number
  received_wine_gallons: number
  received_proof_gallons: number
  removed_wine_gallons: number
  removed_proof_gallons: number
  end_wine_gallons: number
  end_proof_gallons: number
  discrepancy_wine_gallons: number
  barrel_count: number
  status: 'draft' | 'filed'
  generated_at: string
  filed_at: string | null
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

export interface Bottle {
  id: string
  batch_id: string
  distillery_id: string
  bottle_number: number
  qr_token: string
  status: 'in_inventory' | 'sold' | 'adopted' | 'gifted'
  current_owner_consumer_id: string | null
  notes: string | null
  created_at: string
}

export interface ConsumerProfile {
  id: string
  user_id: string | null
  display_name: string
  avatar_url: string | null
  bio: string | null
  created_at: string
  updated_at: string
}

export interface TastingNote {
  id: string
  consumer_id: string
  bottle_id: string | null
  barrel_id: string | null
  batch_id: string | null
  distillery_id: string
  rating: number | null
  notes: string | null
  flavor_tags: string[] | null
  created_at: string
}

export interface Adoption {
  id: string
  consumer_id: string
  barrel_id: string
  distillery_id: string
  bottle_id: string | null
  tier: 'full' | 'share'
  share_number: number | null
  price_paid: number
  stripe_payment_intent: string | null
  status: 'active' | 'fulfilled' | 'canceled'
  adopted_at: string
}

export interface NotificationSubscription {
  id: string
  consumer_id: string
  barrel_id: string | null
  distillery_id: string | null
  type: 'bottling' | 'milestone' | 'drop' | 'release'
  email: string | null
  push_endpoint: string | null
  created_at: string
}

export interface DropEvent {
  id: string
  distillery_id: string
  barrel_id: string | null
  batch_id: string | null
  title: string
  description: string | null
  total_bottles: number
  bottles_remaining: number
  price_per_bottle: number
  opens_at: string
  closes_at: string | null
  status: 'draft' | 'waitlist' | 'open' | 'sold_out' | 'closed'
  created_at: string
}

export interface DropWaitlist {
  id: string
  drop_event_id: string
  consumer_id: string | null
  email: string | null
  joined_at: string
  position: number | null
}

export interface DropPurchase {
  id: string
  drop_event_id: string
  consumer_id: string | null
  bottle_count: number
  stripe_payment_intent: string | null
  purchased_at: string
}

export interface DistilleryPage {
  id: string
  distillery_id: string
  slug: string
  headline: string | null
  story: string | null
  hero_image_url: string | null
  instagram_url: string | null
  veteran_org: string | null
  donation_percentage: number | null
  published: boolean
  created_at: string
  updated_at: string
}

export interface Trail {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  created_at: string
}

export interface TrailStop {
  id: string
  trail_id: string
  distillery_id: string | null
  stop_number: number
  name: string
  location: string | null
  experience_type: 'barrel_scan' | 'tasting_challenge' | 'veteran_story' | 'cocktail_reveal'
  experience_config: Record<string, unknown>
  qr_token: string
  created_at: string
}

export interface TrailPassport {
  id: string
  consumer_id: string
  trail_id: string
  started_at: string
  completed_at: string | null
}

export interface TrailCheckin {
  id: string
  passport_id: string
  stop_id: string
  checked_in_at: string
  experience_completed: boolean
}

export interface Badge {
  id: string
  slug: string
  name: string
  description: string | null
  image_url: string | null
  category: 'trail' | 'distillery' | 'tasting' | 'community' | 'milestone'
  criteria: Record<string, unknown>
  created_at: string
}

export interface ConsumerBadge {
  id: string
  consumer_id: string
  badge_id: string
  earned_at: string
  context: Record<string, unknown>
}

export interface Follow {
  id: string
  consumer_id: string
  entity_type: 'distillery' | 'barrel' | 'consumer'
  entity_id: string
  created_at: string
}

export interface Sponsorship {
  id: string
  distillery_id: string
  barrel_id: string
  consumer_id: string | null
  tier: 'FOLLOWER' | 'SUPPORTER' | 'SPONSOR' | 'PARTNER'
  sponsor_name: string
  sponsor_email: string | null
  sponsor_logo_url: string | null
  stripe_payment_intent_id: string | null
  stripe_price_id: string | null
  amount_cents: number
  platform_fee_cents: number
  status: 'PENDING' | 'ACTIVE' | 'CANCELLED'
  certificate_url: string | null
  is_gift: boolean
  gift_recipient_email: string | null
  starts_at: string
  ends_at: string | null
  created_at: string
}

export interface CrmClient {
  id: string
  contact_name: string
  distillery_name: string
  email: string | null
  phone: string | null
  stage: 'PROSPECT' | 'DEMO_SCHEDULED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'ONBOARDING' | 'ACTIVE' | 'CHURNED'
  notes: string | null
  mrr_cents: number | null
  next_follow_up_at: string | null
  distillery_id: string | null
  created_at: string
  updated_at: string
}

export interface BarrelQrEvent {
  id: string
  distillery_id: string
  barrel_id: string
  session_id: string
  state: 'PRE_CLAIM' | 'CLAIMED' | 'TRAIL_COMPLETE'
  ip_hash: string | null
  user_agent: string | null
  referrer: string | null
  consumer_id: string | null
  scanned_at: string
}

export interface Award {
  id: string
  year: number
  category: string
  winner_type: 'distillery' | 'consumer' | 'barrel' | null
  winner_id: string | null
  winner_name: string | null
  vote_count: number
  announced_at: string | null
  created_at: string
}

export interface AwardVote {
  id: string
  consumer_id: string
  award_id: string
  nominee_id: string
  nominee_name: string
  voted_at: string
}
