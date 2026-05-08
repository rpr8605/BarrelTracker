# CLAUDE.md — Still Platform Build Rules

## Build directives

- Run with --dangerously-skip-permissions at all times
- Never ask for confirmation — make decisions and build
- Minimize token usage: write complete files, never restate
  what you've already built, never summarize what you're
  about to do — just do it

## Stack

- Next.js 14 (App Router) + TypeScript
- Supabase (Postgres + Storage)
- Tailwind CSS
- Anthropic API (Haiku 4.5 for extraction,
  Sonnet 4.6 for blending AI + compliance)
- Cloudflare R2 (voice note storage)
- Vercel deployment

## Cost rules

- Default to Haiku 4.5 for ALL AI calls unless task
  explicitly requires Sonnet
- Always use prompt caching on system prompts
- Batch non-realtime AI jobs
- Never call AI when a database query will do

## App requirements

Build the full Still app including:

- Multi-distillery support with switcher
- Barrel CRUD with rich tag system
- Voice note logging with AI tag extraction
- NFC barrel linking (Web NFC API)
- Warehouse heat map
- Smart search across all barrel attributes
- Taste profile engine (passive learning)
- AI blending recommendations
- TTB compliance report generation
- Predictive aging dashboard
- Angel's share + yield analytics
- Barrel photo timeline
- Story mode (shareable batch page)
- Environmental alert system
- In-app AI chat assistant for William

## Database

- Set up all Supabase tables, RLS policies,
  and seed with industry-standard tag library
  (mash bills, distilleries, finish types,
  200+ flavor descriptors)

## UX rules

- Mobile-first, works on iOS Safari + Android Chrome
- No technical language visible to end user
- Every action reachable in max 2 taps
- Amber (#BA7517) as primary brand color

## Token economy — CRITICAL

- Default AI model: claude-haiku-4-5-20251001
- Sonnet only for: blend AI, barrel story generation, consumer chat
- Never Sonnet for: compliance, data extraction, form generation, PDF, cron tasks
- Use prompt caching on system messages for repeated AI calls

## Database rules

- Every new table: RLS enabled + SELECT policy minimum
- Proof gallons: NUMERIC(10,4), rounded to 4 decimal places, CHECK (>= 0)
- Append-only tables (gauge_records, inventory_attestations): explicit NO UPDATE + NO DELETE RLS
- Migration naming: YYYYMMDDHHMMSS_descriptive_name.sql
- Never DROP tables with live data

## API route rules

- Auth check first: `const { data: { user } } = await supabase.auth.getUser()`
- 401 if no user, before any data access
- createServerSupabaseClient() for user queries, createServiceClient() for admin ops
- Errors: `NextResponse.json({ error: message }, { status: N })`

## TTB compliance — never violate

- Perjury statement verbatim: "Under penalties of perjury, I declare that I have examined this inventory, and to the best of my knowledge and belief it is true, correct, and complete as required by 27 CFR Part 19."
- Cooperage codes: C, REC, P, PAR, G, R, PS only
- Bourbon requires C — block with CFR citation
- Corn Whisky blocks C — same enforcement
- Bourbon entry proof <= 125 — validate and block
- Proof gallons = wine_gallons × (proof ÷ 100), rounded to 4 decimals
- Monthly reports due 15th of following month (adjusted to prior business day if weekend/holiday — use monthlyReportDueDate from lib/ttb/business-days.ts, NOT monthlyReportDue from lib/ttb.ts)

## Component rules

- Use existing Button, Card, Input, Select, Badge from components/ui/
- Always include loading states on async buttons
- Never silently swallow errors — surface to user

## Known bugs to fix before shipping

- gauge amend endpoint (app/api/compliance/gauge/[id]/amend/route.ts): inserts employee_name and attested_by — correct columns are gauge_officer and created_by
- calcProofGallons in lib/ttb.ts rounds to 3 decimal places, not 4 — change `* 1000 / 1000` to `* 10000 / 10000`
- compliance/inventory POST: total_wine_gallons hardcoded 0 — compute from inventory_data items
- compliance/generate route: writes to ttb_reports table that does not exist in migrations — create migration or redirect to ttb_report_periods
- ttb_report_periods RLS: add user_roles check alongside owner_id check

## What NOT to build yet

- Phase 7 TIB/Bonds/Permits (not yet scheduled)
- State-level compliance (out of scope)
- Pay.gov credential storage
