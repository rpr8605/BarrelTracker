# Still Platform — Build Context
*Last updated: 2026-05-08*

## Stack
- Next.js 14.2.35 (App Router) + TypeScript 5
- Supabase (Postgres via @supabase/supabase-js 2.104.1 + @supabase/ssr 0.10.2)
- Tailwind CSS 3.4.1
- Anthropic SDK 0.91.0 (Haiku 4.5 for extraction, Sonnet 4.6 for blend/story/chat)
- Cloudflare R2 via @aws-sdk/client-s3 3.1037.0 (voice notes, photos, attestation PDFs)
- pdf-lib 1.17.1 (inventory attestation PDF generation)
- Stripe 22.1.0 (subscriptions, sponsorships, drops)
- Vercel deployment with daily cron
- PostHog 1.201.0 / posthog-node 4.7.0 (analytics)
- Resend 6.12.2 (email)
- web-push 3.6.7 (push notifications)
- SimpleWebAuthn 13.3.0 (passkey auth)
- Recharts 3.8.1 (analytics charts)
- Zod 4.3.6 (validation)
- react-hook-form 7.73.1
- satori 0.26.0 + @resvg/resvg-js 2.6.2 (OG image generation)
- qrcode 1.5.4 (barrel QR codes)
- date-fns 4.1.0
- lucide-react 1.11.0

## Environment variables expected

From lib/r2.ts:
- CLOUDFLARE_R2_ACCESS_KEY_ID
- CLOUDFLARE_R2_SECRET_ACCESS_KEY
- CLOUDFLARE_R2_ACCOUNT_ID
- CLOUDFLARE_R2_BUCKET_NAME (default: still-voice-notes)

From lib/supabase-server.ts:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY

From lib/anthropic.ts (inferred):
- ANTHROPIC_API_KEY

From lib/stripe.ts / lib/subscription.ts (inferred):
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

From lib/email.ts (inferred via Resend):
- RESEND_API_KEY

From lib/push.ts (inferred via web-push):
- VAPID_PUBLIC_KEY
- VAPID_PRIVATE_KEY
- VAPID_SUBJECT

From lib/posthog.ts (inferred):
- NEXT_PUBLIC_POSTHOG_KEY
- NEXT_PUBLIC_POSTHOG_HOST

## Database — tables that exist

### distilleries
- columns: id (uuid PK), name (text), location (text), owner_id (uuid → auth.users), dsp_number (text), slug (text unique), brand_color (text default #BA7517), is_demo (boolean), plan (text: core/story/trail/pro), logo_url (text), address (text), lat (numeric), lng (numeric), created_at (timestamptz)
- RLS: yes
- Policies: inferred — owner_id-based (used by distilleries_i_can_access() and distilleries_i_can_write() helper functions referenced throughout)
- Indexes: idx_barrels_public_token (on barrels; distilleries itself has no explicit standalone index in migrations)
- Serves: all forms — distillery name, DSP number on every TTB report header
- Gaps: no explicit RLS policy shown in migrations; relies on helper functions defined in an earlier base migration not cataloged here

### barrels
- columns: id (uuid PK), distillery_id (uuid → distilleries), barrel_number (text), mash_bill (text), grain_type (text[]), distillery_source (text), entry_date (text), entry_proof (numeric), current_proof_estimate (numeric), warehouse_row (text), warehouse_slot (integer), warehouse_tier (integer), status (text: aging/ready/bottled/dumped), finish_type (text), nfc_tag_id (text), tags (text[]), photos (text[]), angels_share_pct (numeric), predicted_peak_date (text), profile_match_score (numeric), batch_id (uuid), notes (text), public_token (text unique GENERATED), latitude (numeric 10,8), longitude (numeric 11,8), location_accuracy_m (numeric), location_captured_at (timestamptz), location_label (text), wine_gallons (numeric), current_wine_gallons (numeric), spirits_type (text: bourbon/tennessee_whiskey/rye_whiskey/wheat_whiskey/malt_whiskey/corn_whiskey/neutral_spirits/brandy/rum/gin/tequila/other), warehouse_account (text default bonded), cooperage_code (text: C/REC/P/PAR/G/R/PS), gross_weight_lbs (numeric), fill_temperature_f (numeric 5,2), tare_weight_lbs (numeric 8,2), cooperage_locked (boolean default false), created_at (timestamptz), updated_at (timestamptz)
- RLS: yes (inferred from distilleries_i_can_access/write helper pattern)
- Policies: distillery-scoped read/write via helper functions
- Indexes: idx_barrels_public_token
- Serves: Form 5110.11 barrel package summary, physical inventory reconciliation
- Gaps: proof_gallons not stored directly on barrel (computed on demand); no CHECK constraint on entry_proof <= 125 at DB level (bourbon entry proof enforcement is app-layer only)

### barrel_events
- columns: id (uuid PK), barrel_id (uuid → barrels), distillery_id (uuid → distilleries), event_type (text: fill/transfer_in/transfer_out/gain/loss/bottling/dump), wine_gallons (numeric NOT NULL), proof (numeric), proof_gallons (numeric), notes (text), occurred_at (timestamptz NOT NULL default now()), created_by (uuid → auth.users), created_at (timestamptz), transaction_date (date), is_late_entry (boolean default false)
- RLS: yes
- Policies: barrel_events_distillery_read (SELECT), barrel_events_distillery_write (ALL)
- Indexes: idx_barrel_events_barrel, idx_barrel_events_distillery_period
- Serves: Form 5110.11 received/removed totals; reconcile endpoint
- Gaps: proof_gallons column nullable — reconcile route recalculates on the fly when null; no NOT NULL enforcement

### compliance_snapshots
- columns: id (uuid PK), distillery_id (uuid → distilleries), period (date NOT NULL), spirits_type (text NOT NULL default bourbon), beg_wine_gallons (numeric default 0), beg_proof_gallons (numeric default 0), received_wine_gallons (numeric default 0), received_proof_gallons (numeric default 0), removed_wine_gallons (numeric default 0), removed_proof_gallons (numeric default 0), end_wine_gallons (numeric default 0), end_proof_gallons (numeric default 0), discrepancy_wine_gallons (numeric default 0), barrel_count (integer default 0), status (text: draft/filed), generated_at (timestamptz), filed_at (timestamptz)
- RLS: yes
- Policies: snapshots_distillery_read (SELECT), snapshots_distillery_write (ALL)
- Indexes: idx_compliance_snapshots_distillery
- Serves: Forms 5110.11 (storage), 5110.40 (production beginning balances)
- Gaps: no proof_gallons NUMERIC(10,4) precision enforcement; no CHECK (>= 0) on volume columns

### gauge_records
- columns: id (uuid PK), distillery_id (uuid → distilleries), barrel_id (uuid → barrels nullable), gauge_type (text: production/fill/bottling/regauge/post_tib/tamper NOT NULL), container_id (text NOT NULL), gauged_at (timestamptz NOT NULL), temperature_f (numeric NOT NULL), proof (numeric NOT NULL), wine_gallons (numeric NOT NULL), proof_gallons (numeric NOT NULL), gauge_officer (text NOT NULL), cooperage_code (text: C/REC/P/PAR/G/R/PS), package_id (text), gross_weight_lbs (numeric), notes (text), created_by (uuid → auth.users), created_at (timestamptz), gauge_time (time), container_type (text: barrel/tank/bottling_tank/tote), employee_title (text), is_amended (boolean default false), amends_gauge_id (uuid → gauge_records self-ref), fill_temperature_f (numeric 5,2), transaction_date (date), is_late_entry (boolean default false)
- RLS: yes
- Policies: gauge_distillery_read (SELECT), gauge_distillery_insert (INSERT only — no UPDATE/DELETE)
- Indexes: idx_gauge_records_distillery, idx_gauge_records_barrel
- Serves: 27 CFR 19.618 gauge records; supports Form 5110.11 and 5110.40
- Gaps: gauge_officer field exists but amend endpoint inserts employee_name (column mismatch — amend route references employee_name which does not exist in schema; actual column is gauge_officer); types/database.ts GaugeRecord interface does not include Tier 1 hardening columns (is_amended, amends_gauge_id, etc.)

### production_logs
- columns: id (uuid PK), distillery_id (uuid → distilleries), log_type (text: mash_batch/fermentation/distillation/transfer_to_storage/production_loss NOT NULL), batch_number (text), grain_bill (jsonb), grain_quantity_lbs (numeric), fermentation_start (date), fermentation_end (date), starting_gravity (numeric), ending_gravity (numeric), still_id (text), spirits_type (text), spirits_produced_proof_gallons (numeric), spirits_produced_wine_gallons (numeric), transfer_proof_gallons (numeric), transfer_wine_gallons (numeric), transfer_proof (numeric), loss_proof_gallons (numeric), loss_cause (text), occurred_at (timestamptz NOT NULL default now()), notes (text), created_by (uuid → auth.users), created_at (timestamptz), transaction_date (date), is_late_entry (boolean default false)
- RLS: yes
- Policies: production_logs_read (SELECT), production_logs_write (ALL)
- Indexes: idx_production_logs_distillery
- Serves: Form 5110.40 (Monthly Report of Production Operations)
- Gaps: wide flat table — Tier 2 will split into typed sub-tables; no NUMERIC precision enforcement

### processing_logs
- columns: id (uuid PK), distillery_id (uuid → distilleries), log_type (text: bottling_run/remnant/leaker/tax_removal/processing_receipt/processing_loss NOT NULL), spirits_type (text), product_name (text), proof (numeric), wine_gallons (numeric), proof_gallons (numeric), bottles_filled (integer), bottle_size_ml (numeric), case_count (integer), removal_type (text: tasting_room/retail/wholesale/export), loss_cause (text: breakage/leaker/spillage/evaporation/other), occurred_at (timestamptz NOT NULL default now()), notes (text), created_by (uuid → auth.users), created_at (timestamptz), transaction_date (date), is_late_entry (boolean default false)
- RLS: yes
- Policies: processing_logs_read (SELECT), processing_logs_write (ALL)
- Indexes: idx_processing_logs_distillery
- Serves: Form 5110.28 (Monthly Report of Processing Operations)
- Gaps: same wide-table issue as production_logs; Tier 2 candidate

### inventory_attestations
- columns: id (uuid PK), distillery_id (uuid → distilleries), inventory_type (text: quarterly_storage/semi_annual_processing NOT NULL), period_label (text NOT NULL), inventory_date (date NOT NULL), total_proof_gallons (numeric default 0), barrel_count (integer), container_count (integer), inventory_data (jsonb default []), attested_by_name (text NOT NULL), attested_by_user_id (uuid → auth.users), attested_at (timestamptz), status (text: draft/attested), created_at (timestamptz), signed_by_title (text), perjury_statement (text), ip_address (text), pdf_path (text), pdf_generated_at (timestamptz), discrepancy_noted (boolean default false), discrepancy_notes (text)
- RLS: yes
- Policies: inventory_attestations_read (SELECT), inventory_attestations_write (ALL — note: no INSERT-only restriction, update allowed via service client)
- Indexes: idx_inventory_attestations_distillery
- Serves: 27 CFR 19.623 physical inventory; PDF stored to R2
- Gaps: no NO UPDATE/NO DELETE RLS enforcement (unlike gauge_records); total_wine_gallons not stored (PDF generator receives 0 hardcoded in POST handler)

### ttb_report_periods
- columns: id (uuid PK), distillery_id (uuid NOT NULL → distilleries), report_month (date NOT NULL — first of month), form_5110_40_values (jsonb), form_5110_11_values (jsonb), form_5110_28_values (jsonb), status (text: draft/filed default draft), filed_at (timestamptz), confirmation_number (text), notes (text), created_at (timestamptz)
- Unique: (distillery_id, report_month)
- RLS: yes
- Policies: Users access own report periods (ALL — distillery_id in distilleries where owner_id = auth.uid())
- Indexes: implicit on unique constraint
- Serves: month-over-month continuity checks; balance wizard historical import
- Gaps: policy uses owner_id check directly — does not include user_roles membership; staff with roles but not ownership cannot read/write

### bottles
- columns: id (uuid PK), batch_id (uuid → batches), distillery_id (uuid → distilleries), bottle_number (integer NOT NULL), qr_token (text unique GENERATED), status (text: in_inventory/sold/adopted/gifted default in_inventory), current_owner_consumer_id (uuid), notes (text), created_at (timestamptz)
- RLS: yes
- Policies: distillery_members_read_bottles (SELECT), distillery_writers_manage_bottles (ALL), public_bottle_lookup (SELECT — true)
- Indexes: idx_bottles_batch, idx_bottles_qr_token
- Serves: bottle passport / story pages; Drops

### subscriptions
- columns: id (uuid PK), distillery_id (uuid unique → distilleries), stripe_customer_id (text), stripe_subscription_id (text unique), plan (text: core/story/trail), status (text: active/trialing/past_due/canceled/incomplete), current_period_end (timestamptz), cancel_at_period_end (boolean), created_at (timestamptz), updated_at (timestamptz)
- RLS: yes
- Policies: distillery_members_read_subscription (SELECT), service_role_all (ALL)
- Serves: billing gating

### consumer_profiles
- columns: id (uuid PK), user_id (uuid unique → auth.users), display_name (text NOT NULL), avatar_url (text), bio (text), created_at (timestamptz), updated_at (timestamptz)
- RLS: yes
- Policies: consumer_profiles_public_read (SELECT true), consumer_profiles_own_write (ALL — auth.uid() = user_id)

### tasting_notes
- columns: id (uuid PK), consumer_id (uuid → consumer_profiles), bottle_id (uuid → bottles nullable), barrel_id (uuid → barrels nullable), batch_id (uuid → batches nullable), distillery_id (uuid → distilleries), rating (integer CHECK 1–5), notes (text), flavor_tags (text[]), created_at (timestamptz)
- RLS: yes
- Policies: tasting_notes_public_read (SELECT true), tasting_notes_own_write (ALL), distillery_read_notes (SELECT)
- Indexes: idx_tasting_notes_consumer, idx_tasting_notes_barrel

### adoptions
- columns: id (uuid PK), consumer_id (uuid → consumer_profiles), barrel_id (uuid → barrels), distillery_id (uuid → distilleries), bottle_id (uuid → bottles nullable), tier (text: full/share), share_number (integer), price_paid (numeric), stripe_payment_intent (text), status (text: active/fulfilled/canceled), adopted_at (timestamptz)
- RLS: yes
- Policies: adoptions_own_read (SELECT), adoptions_own_write (INSERT), distillery_read_adoptions (SELECT)
- Indexes: idx_adoptions_consumer, idx_adoptions_barrel

### notification_subscriptions
- columns: id (uuid PK), consumer_id (uuid → consumer_profiles), barrel_id (uuid → barrels nullable), distillery_id (uuid → distilleries nullable), type (text: bottling/milestone/drop/release), email (text), push_endpoint (text), created_at (timestamptz)
- Unique: (consumer_id, barrel_id, type)
- RLS: yes
- Policies: notif_own (ALL)
- Indexes: idx_notification_subscriptions_barrel

### drop_events
- columns: id (uuid PK), distillery_id (uuid → distilleries), barrel_id (uuid → barrels nullable), batch_id (uuid → batches nullable), title (text NOT NULL), description (text), total_bottles (integer default 0), bottles_remaining (integer default 0), price_per_bottle (numeric), opens_at (timestamptz NOT NULL), closes_at (timestamptz), status (text: draft/waitlist/open/sold_out/closed), created_at (timestamptz)
- RLS: yes
- Policies: drop_events_public_read (SELECT — status != draft), drop_events_distillery_all (ALL)

### drop_waitlist
- columns: id (uuid PK), drop_event_id (uuid → drop_events), consumer_id (uuid → consumer_profiles nullable), email (text), joined_at (timestamptz), position (integer)
- Unique: (drop_event_id, consumer_id)
- RLS: yes
- Policies: drop_waitlist_own (ALL)
- Indexes: idx_drop_waitlist_drop

### drop_purchases
- columns: id (uuid PK), drop_event_id (uuid → drop_events), consumer_id (uuid → consumer_profiles nullable), bottle_count (integer default 1), stripe_payment_intent (text), purchased_at (timestamptz)
- RLS: yes
- Policies: drop_purchases_own (SELECT)

### distillery_pages
- columns: id (uuid PK), distillery_id (uuid unique → distilleries), slug (text unique NOT NULL), headline (text), story (text), hero_image_url (text), instagram_url (text), veteran_org (text), donation_percentage (numeric default 0), published (boolean default false), created_at (timestamptz), updated_at (timestamptz)
- RLS: yes
- Policies: distillery_pages_public_read (SELECT — published=true), distillery_pages_owner_all (ALL)

### trails
- columns: id (uuid PK), name (text NOT NULL), description (text), logo_url (text), created_at (timestamptz)
- RLS: yes
- Policies: trails_public_read (SELECT true)
- Seeded: Veterans Whiskey Trail (5 stops)

### trail_stops
- columns: id (uuid PK), trail_id (uuid → trails), distillery_id (uuid → distilleries nullable), stop_number (integer NOT NULL), name (text NOT NULL), location (text), experience_type (text: barrel_scan/tasting_challenge/veteran_story/cocktail_reveal), experience_config (jsonb), qr_token (text unique GENERATED), created_at (timestamptz)
- RLS: yes
- Policies: trail_stops_public_read (SELECT true)

### trail_passports
- columns: id (uuid PK), consumer_id (uuid → consumer_profiles), trail_id (uuid → trails), started_at (timestamptz), completed_at (timestamptz)
- Unique: (consumer_id, trail_id)
- RLS: yes
- Policies: trail_passports_own (ALL), trail_passports_public_read (SELECT true)

### trail_checkins
- columns: id (uuid PK), passport_id (uuid → trail_passports), stop_id (uuid → trail_stops), checked_in_at (timestamptz), experience_completed (boolean)
- Unique: (passport_id, stop_id)
- RLS: yes
- Policies: trail_checkins_own (ALL), trail_checkins_public_read (SELECT true)
- Indexes: idx_trail_checkins_passport

### badges / consumer_badges
- badges: id, slug (unique), name, description, image_url, category (trail/distillery/tasting/community/milestone), criteria (jsonb), created_at
- consumer_badges: id, consumer_id, badge_id, earned_at, context (jsonb)
- RLS: yes on both
- Policies: badges_public_read; consumer_badges_public_read, consumer_badges_own_write
- Indexes: idx_consumer_badges_consumer
- Seeded: 7 badge types

### follows
- columns: id (uuid PK), consumer_id (uuid → consumer_profiles), entity_type (text: distillery/barrel/consumer), entity_id (uuid), created_at (timestamptz)
- Unique: (consumer_id, entity_type, entity_id)
- RLS: yes
- Policies: follows_public_read (SELECT true), follows_own_write (ALL)
- Indexes: idx_follows_consumer, idx_follows_entity

### crm_clients
- columns: id (uuid PK), contact_name (text), distillery_name (text), email (text), phone (text), stage (text: PROSPECT/DEMO_SCHEDULED/PROPOSAL_SENT/NEGOTIATION/ONBOARDING/ACTIVE/CHURNED), notes (text), mrr_cents (integer), next_follow_up_at (timestamptz), distillery_id (uuid → distilleries nullable), created_at (timestamptz), updated_at (timestamptz)
- RLS: yes
- Policies: super_admin_all_crm (ALL — is_super_admin check)

### sponsorships
- columns: id (uuid PK), distillery_id, barrel_id, consumer_id, tier (FOLLOWER/SUPPORTER/SPONSOR/PARTNER), sponsor_name, sponsor_email, sponsor_logo_url, stripe_payment_intent_id, stripe_price_id, amount_cents, platform_fee_cents, status (PENDING/ACTIVE/CANCELLED), certificate_url, is_gift, gift_recipient_email, starts_at, ends_at, created_at
- RLS: yes
- Policies: sponsorships_public_read, sponsorships_consumer_read, sponsorships_distillery_read, sponsorships_service_all
- Indexes: idx_sponsorships_barrel, idx_sponsorships_distillery

### barrel_qr_events
- columns: id (uuid PK), distillery_id, barrel_id, session_id (text NOT NULL), state (PRE_CLAIM/CLAIMED/TRAIL_COMPLETE), ip_hash, user_agent, referrer, consumer_id, scanned_at (timestamptz)
- RLS: yes
- Policies: qr_events_distillery_read, qr_events_super_admin_all, qr_events_public_insert
- Indexes: idx_qr_events_barrel, idx_qr_events_scanned

### awards / award_votes
- awards: id, year (integer), category (BEST_BOURBON etc), winner_type, winner_id, winner_name, vote_count, announced_at, created_at — unique(year, category)
- award_votes: id, consumer_id, award_id, nominee_id, nominee_name, voted_at — unique(consumer_id, award_id)
- RLS: yes on both
- Policies: awards_public_read, awards_super_admin_all; award_votes_own, award_votes_super_admin_read
- Indexes: idx_award_votes_award

### notification_log
- columns: id (uuid PK), consumer_id, distillery_id, barrel_id, type (BARREL_MILESTONE/SPONSORSHIP_UPDATE/TRAIL_PROGRESS/SYSTEM/AWARD), payload (jsonb), sent_at (timestamptz), opened_at (timestamptz)
- RLS: yes
- Policies: notif_log_own, notif_log_distillery_read
- Indexes: idx_notif_log_consumer, idx_notif_log_barrel

### audit_log
- columns: id (uuid PK), admin_user_id (uuid NOT NULL), admin_email (text NOT NULL), action (text NOT NULL), target_user_id (uuid), target_email (text), metadata (jsonb), ip_address (text), user_agent (text), created_at (timestamptz)
- RLS: yes
- Policies: super_admin_read_audit (SELECT), service_insert_audit (INSERT true)
- Indexes: idx_audit_log_admin, idx_audit_log_target, idx_audit_log_created

### user_profiles (referenced, not directly shown in cataloged migrations)
- Includes is_super_admin (boolean default false) — added in 20260504120000
- Referenced by admin policies throughout

## API routes

### Barrels
GET  /api/barrels — list barrels for active distillery
POST /api/barrels — create barrel
GET  /api/barrels/[id] — get single barrel
PATCH /api/barrels/[id] — update barrel
DELETE /api/barrels/[id] — delete barrel
GET  /api/barrels/[id]/qr — generate QR code image for barrel
POST /api/barrels/scan-label — AI label scan extraction

### Compliance
GET  /api/compliance/events — list barrel_events (by distillery_id or barrel_id)
POST /api/compliance/events — create barrel_event (auto-updates barrel current_wine_gallons)
GET  /api/compliance/snapshots — list compliance_snapshots
PATCH /api/compliance/snapshots — update snapshot status (draft/filed)
POST /api/compliance/reconcile — generate compliance_snapshots for a period from barrel_events
GET  /api/compliance/gauge — list gauge_records
POST /api/compliance/gauge — create gauge_record (INSERT only; proof_gallons auto-calculated)
POST /api/compliance/gauge/[id]/amend — create amendment record (marks original is_amended=true, inserts corrected record via service client)
GET  /api/compliance/production — list production_logs
POST /api/compliance/production — create production_log
GET  /api/compliance/processing — list processing_logs
POST /api/compliance/processing — create processing_log
GET  /api/compliance/forms/[form] — generate pre-filled TTB form data (5110-11, 5110-40, 5110-28)
GET  /api/compliance/inventory — list inventory_attestations
POST /api/compliance/inventory — create attestation (generates PDF via pdf-lib, uploads to R2)
PATCH /api/compliance/inventory — update/attest existing inventory record
GET  /api/compliance/report-periods — list ttb_report_periods (last 24)
POST /api/compliance/report-periods — upsert ttb_report_period
PUT  /api/compliance/report-periods — run balance validation check for a period
GET  /api/compliance/late-check — count late-entry records in last 7 days across gauge/production/processing
POST /api/compliance/balance-wizard — seed ttb_report_periods from manually entered historical balances
POST /api/compliance/generate — generate compliance report via AI (writes to ttb_reports table — note: ttb_reports not in cataloged migrations)

### AI
POST /api/ai/chat — AI chat assistant (Sonnet, inventory-aware)
POST /api/ai/blend — blend recommendations (Sonnet)
POST /api/ai/story — batch story generation (Sonnet)
POST /api/ai/extract-tags — tag extraction from text (Haiku)
POST /api/ai/search-insight — search insight (Haiku inferred)
POST /api/ai/flight — flight pairing suggestions

### Voice / Media
POST /api/voice-notes — upload voice note to R2, extract tags via AI
GET  /api/voice-notes — list voice notes for barrel
POST /api/photos/upload — upload barrel photo to R2, append URL to barrel.photos

### Auth
GET  /api/auth/resolve-username — resolve username to user
GET  /api/auth/resolve-distillery — resolve distillery for user
POST /api/auth/demo-login — demo account login
POST /api/auth/signup — user signup
POST /api/auth/webauthn/register-options — WebAuthn register options
POST /api/auth/webauthn/register-verify — WebAuthn register verify
POST /api/auth/webauthn/auth-options — WebAuthn auth options
POST /api/auth/webauthn/auth-verify — WebAuthn auth verify

### Distillery / NFC / Collections
POST /api/distillery/switch — switch active distillery (sets cookie)
GET  /api/nfc/[tagId] — look up barrel by NFC tag
GET/POST /api/tasting-notes — tasting notes CRUD
POST /api/checkin — trail stop check-in
GET/POST /api/follows — follow/unfollow entities
GET/POST /api/collection — consumer collection
POST /api/adoptions/create — create barrel adoption

### Drops
GET  /api/distillery/drops — list drops for distillery
POST /api/drops/[dropId]/waitlist — join waitlist
POST /api/drops/[dropId]/purchase — purchase drop bottles

### Profile / Push
GET/PATCH /api/profile — user profile
GET  /api/push/status — push subscription status
POST /api/push/subscribe — subscribe to push
POST /api/push/unsubscribe — unsubscribe from push

### Batches
POST /api/batches/[id]/bottle — bottle a batch
GET  /api/batches/[id]/qr-sheet — generate QR sheet for batch

### Sponsorships
POST /api/sponsorships/checkout — create Stripe checkout for sponsorship
POST /api/webhooks/stripe/sponsorships — Stripe webhook for sponsorship events

### Admin
GET  /api/admin/master/stats — platform stats
GET  /api/admin/master/audit — audit log
GET  /api/admin/master/users — user list
GET/PATCH /api/admin/master/users/[userId] — user detail/update
POST /api/admin/master/users/[userId]/magic-link — send magic link
POST /api/admin/master/users/[userId]/set-password — set password
POST /api/admin/master/users/[userId]/role — set role
POST /api/admin/master/users/[userId]/suspend — suspend user
POST /api/admin/master/users/[userId]/reactivate — reactivate user
POST /api/admin/crm/update — update CRM client record
POST /api/admin/impersonate — impersonate user
POST /api/admin/exit-view — exit impersonation
POST /api/admin/demo/seed — seed demo data
POST /api/admin/demo/reset — reset demo data
POST /api/admin/awards/create-season — create awards season

### Cron
GET  /api/cron/milestones — daily barrel milestone check and notification dispatch

### Environment / Local
POST /api/environment/log — log environmental sensor reading
GET  /api/local-uploads/[...key] — serve files from .local-uploads/ in dev

### Stripe
POST /api/stripe/webhook — Stripe webhook (subscriptions)

## Lib functions (lib/ttb/)

business-days.ts:
- getNextBusinessDay(date: Date): Date — returns next calendar day that is a business day (skips weekends and federal holidays)
- getPriorBusinessDay(date: Date): Date — returns previous business day
- nextBusinessDayDeadline(transactionDate: Date): Date — 27 CFR 19.580 entry deadline: next business day at 23:59:59
- isRecordLate(transactionDate: Date, entryTimestamp: Date): boolean — true if entryTimestamp > nextBusinessDayDeadline
- taxPeriodDueDate(year: number, month: number, period: 1 | 2): Date — 27 CFR 19.237 FET semi-monthly due dates
- monthlyReportDueDate(year: number, month: number): Date — 15th of following month or prior business day (27 CFR 19.580 monthly reports)
- daysUntil(target: Date): number — days until target date (negative = overdue)

balance-validator.ts:
- validateMonthlyBalances(distilleryId: string, reportMonth: Date, supabase: SupabaseClient): Promise<BalanceValidationResult> — checks prior ttb_report_period ending balances against current compliance_snapshots beginning balances for all three accounts (5110.11 storage, 5110.40 production, 5110.28 processing)
- Exports interfaces: BalanceCheck, BalanceValidationResult

inventory-pdf.ts:
- generateAttestationPDF(data: AttestationPDFData): Promise<Uint8Array> — generates multi-page PDF attestation document using pdf-lib; includes item table, perjury statement, signature block, retention notice (27 CFR 19.631)
- Exports interfaces: InventoryItem, AttestationPDFData

## Lib functions (lib/ttb.ts — root level)

- TTB_SPIRITS_TYPES — const array of {value, label} for all spirit classes
- COOPERAGE_CODES — const array of {value, label, note} for all CFR cooperage codes
- validateCooperage(spiritsType, cooperageCode): string | null — enforces bourbon=C, corn_whiskey!=C
- GAUGE_TYPE_LABELS, PRODUCTION_LOG_LABELS, PROCESSING_LOG_LABELS, TTB_EVENT_LABELS — display string maps
- FET_RATE_REDUCED (2.70), FET_RATE_STANDARD (13.50), FET_CBMA_THRESHOLD (100000)
- calcFET(proofGallons, ytdProofGallons): number — CBMA-aware FET calculation
- calcProofGallons(wineGallons, proof): number — wine_gallons × (proof/100), rounded to 3 decimal places (note: spec says 4; actual implementation rounds to 3)
- eventSign(eventType): 1 | -1 — fills/gains positive, removals negative
- formatWineGal(n), formatProofGal(n): string — display formatters
- spiritsLabel(v): string — value to display label
- monthlyReportDue(periodDate): Date — 15th of following month (no business day adjustment; less precise than business-days.ts version)
- isOverdue(periodDateStr): boolean
- daysUntilDue(periodDateStr): number

## Components

### Barrels
BarrelCard (components/barrels/BarrelCard.tsx) — linked card showing barrel number, status badge, NFC indicator, top 3 tags, profile match score, age bar
BarrelEditForm (components/barrels/BarrelEditForm.tsx) — form for editing barrel fields; uses supabase client directly
AgeBar (components/barrels/AgeBar.tsx) — visual aging progress bar
QRCode (components/barrels/QRCode.tsx) — QR code display for barrel
GeoLocation (components/barrels/GeoLocation.tsx) — capture/display barrel GPS location
LabelScanner (components/barrels/LabelScanner.tsx) — AI-powered barrel label OCR
PhotoTimeline (components/barrels/PhotoTimeline.tsx) — chronological photo gallery for barrel

### Compliance
OverdueBanner (components/compliance/OverdueBanner.tsx) — client component; fetches /api/compliance/late-check, calculates monthly report due date via business-days.ts, displays warning/danger banners for late entries and upcoming/overdue filing deadlines; dismissible

### UI Primitives
Button (components/ui/Button.tsx)
Card (components/ui/Card.tsx)
Badge (components/ui/Badge.tsx) — includes StatusBadge, TagChip exports
Input (components/ui/Input.tsx) — includes Select export

## Pages

Route paths under app/(app)/:
- /dashboard
- /barrels
- /barrels/new
- /barrels/[id]
- /search
- /blend
- /warehouse
- /batches
- /batches/[id]
- /suggestions
- /profile
- /settings
- /settings/billing
- /drops
- /analytics
- /sponsorships
- /compliance
- /compliance/balance-wizard

## Vercel crons

```json
{
  "path": "/api/cron/milestones",
  "schedule": "0 8 * * *"
}
```
Runs daily at 08:00 UTC — barrel milestone checks and notification dispatch.

## Feature status

### Complete
- Barrel CRUD with rich tag system and photos array
- Voice note logging with R2 upload and AI tag extraction
- NFC barrel linking (Web NFC API)
- Smart search page
- Taste profile engine
- AI blending recommendations (Sonnet)
- AI chat assistant (Sonnet, inventory-aware)
- Barrel story generation (Sonnet)
- TTB Form 5110.11, 5110.40, 5110.28 pre-fill generation
- Compliance snapshots (proof-gallon reconciliation per period + spirits type)
- Barrel events ledger with wine_gallon tracking
- Gauge records (27 CFR 19.618) with INSERT-only RLS
- Gauge record amend endpoint (service client, creates corrected record)
- Production logs (27 CFR 19.571) — flat table
- Processing logs (27 CFR 19.601) — flat table
- Inventory attestations with PDF generation (pdf-lib) and R2 upload
- Balance wizard (manual historical period import for mid-year onboarding)
- OverdueBanner component with federal holiday calendar
- balance-validator.ts continuity checks against ttb_report_periods
- business-days.ts with 2025–2027 federal holiday calendar
- ttb_report_periods table for filed period snapshots
- Consumer profiles, tasting notes, adoptions, follows
- Drop events / waitlist / purchases
- Veterans Whiskey Trail with 5 stops, badges, check-ins
- Barrel QR story pages + public tokens
- Admin CRM, super-admin impersonation, audit log
- Stripe subscriptions + sponsorships
- Push notifications
- WebAuthn passkey auth
- Multi-distillery support with switcher cookie
- Barrel geolocation capture
- Daily milestone cron

### Partial — known gaps
- calcProofGallons rounds to 3 decimal places, not 4 (spec requires 4)
- inventory_attestations POST handler passes total_wine_gallons: 0 hardcoded to PDF generator
- gauge amend endpoint references employee_name column that does not exist (actual column is gauge_officer)
- ttb_report_periods RLS uses owner_id check only — staff with user_roles cannot access
- types/database.ts GaugeRecord interface missing Tier 1 hardening columns
- compliance/generate route writes to ttb_reports table which does not appear in cataloged migrations
- monthlyReportDue in lib/ttb.ts does not apply business-day adjustment (use monthlyReportDueDate from lib/ttb/business-days.ts instead)
- Warehouse heat map exists as a page (/warehouse) but implementation not verified beyond page existence
- Predictive aging dashboard (/suggestions) — implementation not verified
- Environmental alert system — /api/environment/log exists but alert dispatch not verified
- Angel's share analytics — field exists on barrel (angels_share_pct) but calculation source not found

### Not started
- State-level compliance
- Pay.gov integration
- Tier 2 schema refactor (7 new tables replacing flat production_logs/processing_logs)

## Known issues

1. **gauge amend column mismatch** — `app/api/compliance/gauge/[id]/amend/route.ts` line 48 inserts `employee_name` and line 44 inserts `attested_by` — neither column exists in gauge_records schema. The correct columns are `gauge_officer` and `created_by`. This will cause a Postgres error on every amend attempt.

2. **calcProofGallons precision** — `lib/ttb.ts` rounds to 3 decimal places (`Math.round(... * 1000) / 1000`). TTB requires 4. Fix: change multiplier to 10000.

3. **total_wine_gallons hardcoded to 0** — `app/api/compliance/inventory/route.ts` line 76 passes `total_wine_gallons: 0` to `generateAttestationPDF`. PDF will always show 0.0000 WG total.

4. **ttb_reports table missing** — `app/api/compliance/generate/route.ts` writes to `ttb_reports` but no migration creates this table. Will throw a Postgres error.

5. **ttb_report_periods RLS gap** — policy uses `distillery_id in (select id from distilleries where owner_id = auth.uid())` — excludes staff members who have access via `user_roles` but are not the owner.

6. **types/database.ts GaugeRecord** — missing fields added in Tier 1 hardening: `gauge_time`, `container_type`, `employee_title`, `is_amended`, `amends_gauge_id`, `fill_temperature_f`, `transaction_date`, `is_late_entry`.

7. **lib/ttb.ts vs lib/ttb/business-days.ts deadline functions** — `monthlyReportDue` in lib/ttb.ts always returns the 15th; `monthlyReportDueDate` in lib/ttb/business-days.ts correctly adjusts for weekends/holidays. OverdueBanner correctly uses the business-days.ts version; other callers of lib/ttb.ts version may compute wrong deadlines.

## Build conventions

### Auth check in API routes
Every route checks auth as the first operation:
```ts
const supabase = createServerSupabaseClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
```

### createServerSupabaseClient vs createServiceClient
- `createServerSupabaseClient()` — anon key + cookie-based SSR client. Used ONLY for `auth.getUser()`.
- `createServiceClient()` — raw createClient with service role key. Used for ALL database queries (bypasses RLS). Do not use @supabase/ssr variant with service role — it leaks the user JWT as Authorization header.

### Error response format
`NextResponse.json({ error: message }, { status: N })`

### Component import paths
All imports use `@/` path alias: `@/components/ui/Button`, `@/lib/supabase-server`, `@/lib/ttb`, `@/types/database`

### Migration file naming convention
`YYYYMMDDHHMMSS_descriptive_name.sql`
Note: `20260508_ttb_phase1_phase2.sql` lacks the time component — technically non-conforming. All others conform.

## Session log

### 2026-05-08 — Tier 1 hardening + documentation pass
Fixed:
- Gauge records: INSERT-only RLS, amend endpoint, missing columns
- Inventory attestation: PDF generated with pdf-lib, uploaded to R2, pdf_path stored in DB
- ttb_report_periods table added for month-over-month continuity checks
- Balance wizard: manual historical data import for mid-year onboarding
- OverdueBanner: surfaces late entries and filing deadline countdown
- business-days.ts: federal holiday calendar, next-business-day deadline
- balance-validator.ts: continuity check against ttb_report_periods
- inventory-pdf.ts: pdf-lib PDF generator for signed attestations

TypeScript status: clean (1 pre-existing test error in tests/auth.spec.ts, unrelated)

Pending migration apply: 20260508300000 and 20260508400000 need to be run in Supabase SQL editor — Supabase CLI has persistent migration state mismatch with 20260508 bare timestamp

Ready for: Tier 2 schema refactor — 7 new tables replacing flat production_logs/processing_logs

### 2026-05-08 — Bug fixes + Phase 6 (Standards of Identity, COLA, Formula)
Fixed:
  - calcProofGallons now rounds to 4 decimal places (was 3) — lib/ttb.ts
  - inventory total_wine_gallons now summed from items (was hardcoded 0) — app/api/compliance/inventory/route.ts
  - compliance/generate route now references ttb_report_periods (was ttb_reports) — app/api/compliance/generate/route.ts
  - transaction_date defaults server-side to today on all 9 record-save routes (was defaulting to event date)
  - tsconfig.json: excluded __tests__/** and tests/** so test runner globals don't error tsc
Added:
  - Sidebar nav: /production, /processing, /tax, /products added to Sidebar.tsx
  - GET /api/compliance/inventory?populate=true returns live barrel snapshot as inventory_data
  - PATCH /api/compliance/report-periods: marks individual form (5110.40/11/28/5000.24) as submitted with confirmation number
  - Migration 20260508700000: per-form status columns on ttb_report_periods
  - app/api/cron/zero-activity-check/route.ts: emails distilleries with zero activity who haven't filed
  - vercel.json: cron for zero-activity-check (7th of month at 14:00 UTC)
  - lib/ttb/standards-of-identity.ts: full IDENTITY_RULES engine + validateStandardOfIdentity with CFR citations
  - Standards validation wired into POST /api/barrels (returns 422 with violations array on identity violation)
  - lib/ttb/age-calculator.ts: calculateBarrelAge, getBlendAgeStatement with mandatory disclosure logic
  - Barrel detail page: age disclosure badges (amber) for mandatory_age_disclosure and under_2_years
  - Migration 20260508800000: cola_records + formula_records tables with RLS
  - CRUD API: /api/products/cola, /api/products/cola/[id], /api/products/formula, /api/products/formula/[id]
  - Formula PATCH: creates new version when approved formula has ingredients changed
  - app/(app)/products/page.tsx: COLA + Formula tabs with checklist, status management, version modal
  - lib/ttb/index.ts: exports validateStandardOfIdentity, ValidationResult, calculateBarrelAge, getBlendAgeStatement, BarrelAge
  - Test files: lib/ttb/__tests__/calcProofGallons.test.ts, standards-of-identity.test.ts, age-calculator.test.ts

### 2026-05-08 — Phase 7: TIB Records, Compliance Calendar, History Import, R2 Signed URLs
Added:
  - Migration 20260508900000: dsp_counterparties, tib_records (with proof_gallons GENERATED ALWAYS AS stored), dsp_documents, amendment_alerts tables — all RLS using owner_id
  - Migration 20260508950000: import_source column on ttb_report_periods
  - lib/ttb/tib-serial.ts: getNextTIBSerial() — auto-increments TIB-YYYY-NNNN serial numbers per distillery/year
  - lib/ttb/amendment-triggers.ts: fireTrigger() with dedup logic (no duplicate pending alerts per type+relatedId)
  - lib/ttb/compliance-calendar.ts: generateComplianceDeadlines() — monthly reports, FET semi-monthly, quarterly inventory, semi-annual inventory, permit expirations
  - GET/POST /api/tib: list + create TIB records with auto serial; fires first_tib_inbound alert on first inbound
  - GET/PATCH/DELETE /api/tib/[id]: update status/notes; DELETE blocks after 24h
  - GET/POST/PATCH/DELETE /api/tib/counterparties: TIB trading partner management
  - GET/POST /api/permits: DSP documents (basic_permit, dsp_registration, operating_bond, tib_bond, etc.); fires permit_expiring alert within 90 days
  - PATCH/DELETE /api/permits/[id]: update permit; re-fires expiry alert on expiration_date change
  - GET/PATCH /api/compliance/amendment-alerts: list alerts (count=true mode for badge); acknowledge/resolve actions
  - GET /api/compliance/calendar: generates ComplianceDeadline[] with status (filed/overdue/due_soon/upcoming)
  - GET /api/compliance/calendar/export.ics: ICS calendar export for all compliance deadlines (12 months)
  - POST /api/compliance/import-history/extract: multipart PDF upload → Claude Haiku 4.5 vision extraction → structured JSON
  - GET/POST /api/compliance/import-history: list periods + bulk upsert with import_source=historical_import
  - GET /api/compliance/inventory/[id]/pdf: signed R2 URL redirect for attestation PDFs
  - app/(app)/compliance/permits/page.tsx: 3-tab page (Documents, Counterparties, Alerts)
  - app/(app)/compliance/calendar/page.tsx: deadline list with filter + .ics export button
  - app/(app)/compliance/import-history/page.tsx: PDF extract tab + manual entry tab
  - Sidebar: added /compliance/calendar (Cal. Deadlines), /compliance/permits (Permits) nav items; red alert badge on Compliance item using amendment_alerts count API
  - compliance/page.tsx: import history banner when 0 ttb_report_periods rows on file
  - BarrelDetailClient.tsx: TIB history card in right column (loads from /api/tib?barrel_id=X)
  - lib/ttb/index.ts: exports getNextTIBSerial, fireTrigger, generateComplianceDeadlines, ComplianceDeadline
  - TypeScript: 0 errors

Platform is now feature-complete for TTB compliance Phase 7.

Pending (infrastructure, not code):
  - R2 credentials in Vercel
  - Stripe live keys
  - VAPID keys
  - Apply migrations 20260508900000 + 20260508950000 in Supabase SQL editor
