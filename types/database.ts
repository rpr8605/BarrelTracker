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
  public_token: string | null
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
  cooperage_code: string | null
  gross_weight_lbs: number | null
  created_at: string
  updated_at: string
}

export interface GaugeRecord {
  id: string
  distillery_id: string
  barrel_id: string | null
  gauge_type: 'production' | 'fill' | 'bottling' | 'regauge' | 'post_tib' | 'tamper'
  container_id: string
  gauged_at: string
  temperature_f: number
  proof: number
  wine_gallons: number
  proof_gallons: number
  gauge_officer: string
  cooperage_code: string | null
  package_id: string | null
  gross_weight_lbs: number | null
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface ProductionLog {
  id: string
  distillery_id: string
  log_type: 'mash_batch' | 'fermentation' | 'distillation' | 'transfer_to_storage' | 'production_loss'
  batch_number: string | null
  grain_bill: Record<string, number> | null
  grain_quantity_lbs: number | null
  fermentation_start: string | null
  fermentation_end: string | null
  starting_gravity: number | null
  ending_gravity: number | null
  still_id: string | null
  spirits_type: string | null
  spirits_produced_proof_gallons: number | null
  spirits_produced_wine_gallons: number | null
  transfer_proof_gallons: number | null
  transfer_wine_gallons: number | null
  transfer_proof: number | null
  loss_proof_gallons: number | null
  loss_cause: string | null
  occurred_at: string
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface ProcessingLog {
  id: string
  distillery_id: string
  log_type: 'bottling_run' | 'remnant' | 'leaker' | 'tax_removal' | 'processing_receipt' | 'processing_loss'
  spirits_type: string | null
  product_name: string | null
  proof: number | null
  wine_gallons: number | null
  proof_gallons: number | null
  bottles_filled: number | null
  bottle_size_ml: number | null
  case_count: number | null
  removal_type: 'tasting_room' | 'retail' | 'wholesale' | 'export' | null
  loss_cause: 'breakage' | 'leaker' | 'spillage' | 'evaporation' | 'other' | null
  occurred_at: string
  notes: string | null
  created_by: string | null
  created_at: string
}

export interface InventoryAttestation {
  id: string
  distillery_id: string
  inventory_type: 'quarterly_storage' | 'semi_annual_processing'
  period_label: string
  inventory_date: string
  total_proof_gallons: number
  barrel_count: number | null
  container_count: number | null
  inventory_data: Array<{
    container_id: string
    spirits_type: string
    proof_gallons: number
    location?: string
  }>
  attested_by_name: string
  attested_by_user_id: string | null
  attested_at: string | null
  status: 'draft' | 'attested'
  created_at: string
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

export interface MaterialLibraryEntry {
  id: string
  distillery_id: string | null
  name: string
  normalized_name: string
  category: 'grain' | 'finish' | 'ingredient' | 'wood' | 'wine' | 'beer' | 'spirit' | 'syrup' | 'experimental' | 'other'
  parent_group: string | null
  notes: string | null
  active: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TtbReport {
  id: string
  distillery_id: string
  report_month: string
  form_5110_40_values: Record<string, any> | null
  form_5110_11_values: Record<string, any> | null
  form_5110_28_values: Record<string, any> | null
  form_5000_24_values: Record<string, any> | null
  status: 'draft' | 'filed'
  filed_at: string | null
  confirmation_number: string | null
  notes: string | null
  created_at: string
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

export interface RawMaterialLot {
  id: string
  distillery_id: string
  material_name: string
  source: string | null
  lot_number: string | null
  quantity: number
  unit: string
  cost: number | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ProductionBatch {
  id: string
  distillery_id: string
  batch_name: string
  start_date: string | null
  end_date: string | null
  status: 'planned' | 'active' | 'completed' | 'cancelled' | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface FermentationBatch {
  id: string
  distillery_id: string
  production_batch_id: string
  yeast_type: string | null
  gravity_og: number | null
  gravity_fg: number | null
  temp_log: Array<{ timestamp: string; temp_f: number }> | null
  status: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface DistillationRun {
  id: string
  distillery_id: string
  production_batch_id: string
  still_id: string | null
  run_number: string | null
  start_time: string | null
  end_time: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface DistillationCut {
  id: string
  distillery_id: string
  run_id: string
  cut_type: 'heads' | 'hearts' | 'tails' | null
  volume_gallons: number | null
  proof: number | null
  destination_id: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface HoldingTank {
  id: string
  distillery_id: string
  tank_name: string
  capacity_gallons: number | null
  current_volume_gallons: number
  current_proof: number | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface BlendBatch {
  id: string
  distillery_id: string
  blend_name: string
  target_proof: number | null
  target_volume_gallons: number | null
  status: 'draft' | 'active' | 'bottled' | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface BlendBatchComponent {
  id: string
  distillery_id: string
  blend_batch_id: string
  source_type: 'barrel' | 'holding_tank' | null
  source_id: string
  volume_gallons: number
  proof: number
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ProofingAdjustment {
  id: string
  distillery_id: string
  source_type: 'tank' | 'blend' | null
  source_id: string
  water_added_gallons: number
  pre_proof: number | null
  post_proof: number | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface BottlingRun {
  id: string
  distillery_id: string
  blend_batch_id: string
  bottling_date: string | null
  bottle_size_ml: number | null
  bottle_count: number | null
  label_name: string | null
  tasting_notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface FinishedGoodsLot {
  id: string
  distillery_id: string
  bottling_run_id: string
  sku: string | null
  lot_number: string | null
  quantity_cases: number | null
  warehouse_location: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface FinishedGoodsMovement {
  id: string
  distillery_id: string
  lot_id: string
  movement_type: 'sale' | 'transfer' | 'adjustment' | null
  quantity_cases: number
  destination: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface NpdProject {
  id: string
  distillery_id: string
  project_name: string
  category: string | null
  target_proof: number | null
  status: 'concept' | 'pilot' | 'approved' | 'archived' | null
  ai_brief: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface NpdVersion {
  id: string
  distillery_id: string
  project_id: string
  version_number: string
  formula_notes: string | null
  cost_estimate: number | null
  sensory_notes: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface ConsultantReview {
  id: string
  distillery_id: string
  target_type: string // ttb_report, formula, label, release
  target_id: string
  reviewer_id: string | null
  status: 'pending' | 'approved' | 'needs_revision' | null
  comments: string | null
  created_at: string
  updated_at: string
  created_by: string | null
}

export interface AssetTag {
  id: string
  distillery_id: string
  public_slug: string
  tag_url: string
  tag_type: 'qr' | 'nfc' | 'uhf' | 'hybrid'
  nfc_uid: string | null
  uhf_epc: string | null
  assigned_entity_type: 'product' | 'batch' | 'barrel' | 'bottle' | 'case' | 'pallet' | 'compliance_record' | 'other'
  assigned_entity_id: string | null
  status: 'draft' | 'printed' | 'written' | 'verified' | 'active' | 'retired' | 'lost' | 'damaged'
  public_enabled: boolean
  regulator_view_enabled: boolean
  internal_required: boolean
  printed_label_template_id: string | null
  written_at: string | null
  written_by: string | null
  verified_at: string | null
  verified_by: string | null
  last_scanned_at: string | null
  scan_count: number
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TagScanEvent {
  id: string
  asset_tag_id: string
  scanned_at: string
  scan_source: 'qr' | 'nfc' | 'uhf' | 'manual' | null
  viewer_type: 'public' | 'internal' | 'distributor' | 'regulator' | 'unknown' | null
  user_id: string | null
  ip_address: string | null
  user_agent: string | null
  referrer: string | null
  location_hint: string | null
  action_taken: string | null
  metadata: Record<string, any> | null
}

export interface ComplianceDocument {
  id: string
  distillery_id: string
  entity_type: 'product' | 'batch' | 'barrel' | 'bottle' | 'case' | 'pallet'
  entity_id: string
  document_type: 'ttb_cola' | 'state_registration' | 'label_image' | 'formula' | 'distributor_agreement' | 'sell_sheet' | 'price_sheet' | 'abc_correspondence' | 'other'
  title: string
  file_url: string | null
  external_url: string | null
  state: string | null
  document_number: string | null
  status: string | null
  uploaded_by: string | null
  created_at: string
  updated_at: string
}

export interface ColaRecord {
  id: string
  distillery_id: string
  entity_type: string
  entity_id: string
  ttb_cola_number: string | null
  ttb_cola_registry_url: string | null
  status: string | null
  approval_date: string | null
  brand_name: string | null
  class_type: string | null
  label_version: string | null
  last_verified_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface StateRegistration {
  id: string
  distillery_id: string
  entity_type: string
  entity_id: string
  state: string
  agency_name: string | null
  registration_number: string | null
  status: 'not_started' | 'submitted' | 'approved' | 'rejected' | 'renewal_due' | 'expired' | null
  submitted_at: string | null
  approved_at: string | null
  expires_at: string | null
  renewal_due_at: string | null
  fee_status: string | null
  distributor_required: boolean | null
  distributor_name: string | null
  wholesaler_assignment: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ControlStateCode {
  id: string
  distillery_id: string
  entity_type: string
  entity_id: string
  nabca_code: string | null
  state: string | null
  state_item_code: string | null
  size_ml: number | null
  pack_size: string | null
  status: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface LabelTemplate {
  id: string
  distillery_id: string
  name: string
  template_type: 'barrel' | 'product' | 'batch' | 'case' | 'bottle' | 'pallet'
  description: string | null
  dimensions_json: Record<string, any> | null
  fields_json: Record<string, any> | null
  is_default: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface TagAuditEvent {
  id: string
  asset_tag_id: string
  event_type: string
  actor_id: string | null
  message: string | null
  metadata: Record<string, any> | null
  created_at: string
}

export interface ActionCenterItem {
  id: string
  distillery_id: string
  module: string
  entity_type: string | null
  entity_id: string | null
  title: string
  description: string | null
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info'
  status: 'detected' | 'assigned' | 'in_progress' | 'resolved' | 'dismissed'
  assigned_to: string | null
  due_at: string | null
  created_at: string
  resolved_at: string | null
  auto_resolution_rule: any
  recommended_actions: any
}

export interface ReportSnapshot {
  id: string
  distillery_id: string
  report_type: string
  generated_at: string
  time_window: string | null
  metrics_json: any
  summary: string | null
  good_changes: any
  warnings: any
  blockers: any
  recommended_actions: any
}

export interface SavedBarrelView {
  id: string
  distillery_id: string
  name: string
  filter_json: any
  sort_json: any
  group_by: string | null
  is_pinned: boolean
  created_by: string | null
  created_at: string
}

export interface CustomBarrelList {
  id: string
  distillery_id: string
  name: string
  description: string | null
  created_by: string | null
  created_at: string
}

export interface CustomBarrelListItem {
  id: string
  list_id: string
  barrel_id: string
  notes: string | null
  added_at: string
}

export interface MarketingCampaign {
  id: string
  distillery_id: string
  name: string
  status: 'draft' | 'active' | 'archived'
  goals: string | null
  metrics_json: any
  created_at: string
  updated_at: string
}

export interface NotificationRule {
  id: string
  distillery_id: string
  event_type: string
  channels: string[]
  severity_threshold: string | null
  is_active: boolean
}
