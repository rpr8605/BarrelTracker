# Still Repo Audit

## Executive Summary
The Still repository is surprisingly mature. It is not a hollow UI shell; it is a highly developed Next.js App Router application backed by a sophisticated Supabase PostgreSQL schema. The foundational architecture for multitenancy, role-based access control, AI integration, and TTB compliance tracking is genuinely built and wired. However, the repository suffers from a severe lack of automated testing (only basic auth flows are covered by Playwright) and runs the risk of feature bloat (e.g., consumer drops, AI master blenders) before the core MVP production floor workflows are stabilized. It is ready for controlled beta testing, not a rewrite.

## Current Technical Stack
- **Framework:** Next.js 14.2 (App Router) with `@ducanh2912/next-pwa` for mobile installation.
- **Language:** TypeScript (Strict).
- **Backend/Database:** Supabase (PostgreSQL with RLS), Edge Functions/Server Actions.
- **Auth Layer:** Supabase Auth + `@simplewebauthn` for passwordless/biometrics.
- **Styling:** Tailwind CSS + custom variable system.
- **Deployment:** Vercel (App) / Supabase (DB).
- **Env Vars Expected:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `POSTHOG_KEY`.

## What Is Actually Built

| Feature | Status | Files | Notes |
| :--- | :--- | :--- | :--- |
| **Auth / Onboarding** | Complete | `app/login/`, `app/(onboarding)` | Functional, supports magic links/passkeys. |
| **Multi-tenancy / RLS** | Complete | `supabase/migrations/`, `lib/role-context.tsx` | Strong tenant isolation via `distillery_id` and PostgreSQL RLS policies. |
| **Barrel Tracking** | Complete | `app/(app)/barrels/`, `types/database.ts` | Fully wired. Supports QR/NFC linking, fills, dumps, and historical events. |
| **Batch Production** | Complete | `app/(app)/batches/` | Wired to backend. Supports linking ingredients and tracing to barrels. |
| **TTB Compliance** | Built | `lib/ttb.ts`, `supabase/migrations/` | Extensive implementation of cooperage codes, proof gallons math, and FET calculations. |
| **QR / NFC Mobile** | Built | `components/barrels/QRCode.tsx`, `lib/nfc.ts` | Hardware API access implemented. Real generation and scan events exist. |
| **Voice Notes** | Built | `components/voice/VoiceRecorder.tsx` | Uses native `navigator.mediaDevices` and routes through AI transcription. |
| **AI Assistant** | Built | `lib/ai-router.ts`, `lib/anthropic.ts` | Not mocked. Live calls to Anthropic Claude 3 models with explicit cost control mechanisms. |
| **Demo Mode** | Built | `lib/demo-seed.ts` | Generates a fully populated, realistic tenant DB on the fly rather than faking UI state. |

## Current Routes and Screens

| Route | File | Purpose | Status | MVP Fit |
| :--- | :--- | :--- | :--- | :--- |
| `/login` | `app/login/page.tsx` | Entry point | Complete | Mandatory |
| `/(onboarding)/*` | `app/(onboarding)/layout.tsx` | Setup wizard | Complete | Mandatory |
| `/(app)/dashboard` | `app/(app)/dashboard/page.tsx` | High-level metrics | Complete | Mandatory |
| `/(app)/barrels` | `app/(app)/barrels/page.tsx` | Inventory management | Complete | Mandatory |
| `/(app)/batches` | `app/(app)/batches/page.tsx` | Production runs | Complete | Mandatory |
| `/(app)/compliance` | `app/(app)/compliance/page.tsx` | TTB reporting | Built | Mandatory |
| `/(command)/*` | `app/(command)/layout.tsx` | Internal Admin OS | Complete | Admin Only |
| `/(app)/drops` | `app/(app)/drops/page.tsx` | Consumer releases | Partial | Defer/Remove for MVP |
| `/(app)/sponsorships` | `app/(app)/sponsorships/page.tsx`| Investor views | Partial | Defer/Remove for MVP |

## Current User Workflow
1. **User lands on `/login`** -> Successfully authenticates via Supabase.
2. **Setup** -> Routed through onboarding to configure distillery defaults (cooperage, NFC expectations).
3. **Dashboard** -> Reaches `/(app)/dashboard`.
4. **Create Batch** -> Navigates to Batches, defines mash bill and yield. (Works, writes to DB).
5. **Create/Fill Barrels** -> Generates barrels, assigns temporary QR, logs initial proof/volume. (Works).
6. **Floor Operations** -> Uses mobile device to scan QR, bringing up Barrel Detail view. (Works).
7. **Log Actions** -> Logs tasting notes or voice notes. AI auto-extracts flavor profiles via Anthropic. (Works).
8. **Compliance Export** -> System automatically calculates proof gallons and applies FET rates based on movements. (Wired, but UI for final TTB form export is complex and may have UX gaps).

## Data Model Findings
- **File Paths:** `types/database.ts`, `supabase/migrations/*.sql`
- The data model is remarkably robust. Entities exist for `Distillery`, `Barrel`, `Batch`, `TastingNote`, `VoiceNote`, `AssetTag`, and strict audit ledgers like `ProductionLog` and `ProcessingLog`.
- **Relationships:** Well-defined. Barrels link to batches. Notes link to barrels. Events are appended immutably.
- **RLS:** Considered and implemented. `20260508400000_rls_gauge_immutability.sql` and `20260508960000_rls_user_roles_fix.sql` prove the database is locked down at the row level.

## Barrel and Batch Lifecycle Findings
- **Barrel:** The repository supports a real lifecycle. You can create, fill, gauge, track movements (`transfer_in`, `transfer_out`), move to bottling, and dump. TTB events are explicitly mapped in `lib/ttb.ts`.
- **Batch:** Supported. You can define runs, link raw materials, and track output volume to barrel fills.
- **Missing:** The repository has advanced features (Consumer drops, "Project Honeycomb") that obscure the simplicity needed for an operator just trying to log a fast gravity reading on the floor. 

## AI Findings
- **File Paths:** `lib/ai-router.ts`, `lib/anthropic.ts`
- **Status:** Deeply integrated and entirely real.
- **Capabilities:** Translates unstructured voice notes into structured tags (`extractTagsFromText`), acts as an AI master blender (`generateBlendRecommendations`), and assists with TTB compliance generation.
- **Guardrails:** Present. It uses specific models based on the task (e.g., `claude-3-haiku` for fast parsing) and supports OpenRouter `:zdr` for zero data retention.
- **Risk:** Over-engineered for MVP. Generating consumer marketing stories via AI is neat, but secondary to basic production logging.

## QR/NFC/Mobile Floor Workflow Findings
- **Implementation:** Real. `lib/nfc.ts` manages tag reading/writing. `components/barrels/QRCode.tsx` handles fallback generation. `navigator.mediaDevices` is used for floor voice-note capture.
- **Missing:** Offline mode robustness. While the app uses `next-pwa`, complex offline caching and sync for Supabase queries deep in a rickhouse without WiFi are not explicitly handled in a custom service worker.

## UX/Mobile Findings
- **Good:** The UI uses Tailwind aggressively to ensure responsive layouts. The presence of PWA manifests means it's designed to be installed on an iPad/iPhone.
- **Bad:** There is too much dashboard fluff. Navigation contains routes for sponsorships, drops, and consumer profiles. A distillery floor worker needs a massive "SCAN" button and big tap targets, not investor relations charts.

## Compliance, Audit, and Export Findings
- **Status:** Real and impressive.
- **Files:** `lib/ttb.ts`, `supabase/migrations/20260508...`
- The system hardcodes cooperage codes (27 CFR Part 19), explicitly tracks CBMA Federal Excise Tax thresholds (`FET_CBMA_THRESHOLD`), and calculates Proof Gallons securely. RLS policies enforce immutability on gauge records. This is not fake.

## Integrations Findings

| Integration | Status | Files | Env Vars | Risks |
| :--- | :--- | :--- | :--- | :--- |
| Supabase | Active | `lib/supabase*.ts` | `SUPABASE_URL`, `ANON_KEY` | None, well implemented. |
| Anthropic | Active | `lib/anthropic.ts` | `ANTHROPIC_API_KEY` | High cost if unmonitored. |
| Stripe | Configured | `lib/stripe.ts` | `STRIPE_SECRET_KEY` | Distraction from core MVP. |
| Resend | Configured | `lib/email.ts` | `RESEND_API_KEY` | Minimal. |
| PostHog | Active | `components/analytics/`| `NEXT_PUBLIC_POSTHOG_KEY`| Minimal. |

## Security and Multi-Tenant Risks
- The security posture is strong. Supabase Row Level Security (RLS) is explicitly implemented to prevent cross-tenant data leakage. 
- Role context (`lib/role-context.tsx`) restricts UI access based on 'owner', 'manager', or 'staff'.
- The `/api` routes correctly wrap Supabase server clients to respect RLS.
- **Risk:** Ensure `SUPABASE_SERVICE_ROLE_KEY` is absolutely never leaked to the client bundle, as it bypasses all RLS.

## Mock/Demo Data Findings
- Mock data is localized exclusively to `lib/demo-seed.ts`.
- The application does **not** hardcode fake data into the React components. Instead, a "Demo Mode" login executes a server action that populates a segregated tenant database with highly realistic historical data (aging calculations, scan events, etc.).
- **Risk:** Negligible. The architecture ensures demo data lives in a real database schema isolated from real users.

## Code Quality Findings
- The codebase is clean, well-architected, and adheres to strict TypeScript patterns.
- **Severe Risk:** Test coverage is practically non-existent. `tests/auth.spec.ts` and `tests/auth-diagnostics.spec.ts` are the only Playwright tests. For a system handling federal excise tax math and immutable compliance logs, the lack of automated E2E testing for the core barrel lifecycle is a critical liability.

## Missing MVP Pieces
1. **Offline Sync Engine:** Crucial for rickhouses without WiFi.
2. **E2E Test Suite:** Playwright tests covering the full creation-to-dump lifecycle.
3. **Simplified Mobile View:** A dedicated, stripped-down layout for floor workers focused solely on scanning and fast-logging.

## Recommended MVP Workflow
1. User logs in.
2. Hits a simplified mobile-first dashboard featuring a prominent "Scan Tag" button.
3. Scans barrel -> opens fast-action modal.
4. User taps "Log Proof/Volume" or holds "Record Voice Note".
5. Hits Save. Data syncs to Supabase.

## Recommended Screen Map
- `/(app)/dashboard` (Simplified)
- `/(app)/scan` (Camera view)
- `/(app)/barrels/[id]` (Detail & Action Log)
- `/(app)/batches` (Production planning)
- `/(app)/compliance` (Automated TTB exports)

## Recommended Data Model
The current data model is sufficient and should not be modified.

## Recommended Build Order
1. **Prune:** Hide/Disable `/drops`, `/sponsorships`, `/consumer` routes via feature flags.
2. **Test:** Write comprehensive Playwright tests for Barrel and Batch lifecycles.
3. **Optimize Mobile:** Build a dedicated, high-contrast mobile scanning shell for the floor worker role.
4. **Offline:** Implement a robust offline queue for the PWA using IndexedDB for action logs.

## Expected First Playwright Results
- **Auth tests:** PASS
- **Routing tests (if written):** PASS
- **Core Lifecycle (Create Batch -> Fill Barrel -> Dump):** Unknown, but likely brittle due to complex relational constraints and RLS policies that have not been exercised via automated UI drivers.

## Risks / Blockers
- **Testing:** The lack of automated tests means any future refactoring of the complex TTB math or RLS policies could quietly break the system.
- **Feature Creep:** The app has too many consumer-facing and investor-facing features that dilute the core value proposition of being a fast, lightweight floor OS.

## Final Recommendation
- **continue/refactor current repo**

The foundation is remarkably solid, the data model is accurate to industry compliance standards, and the AI integration is real. Stop building new features, prune the UI to focus strictly on the production floor MVP, and aggressively write Playwright tests for the core lifecycle.