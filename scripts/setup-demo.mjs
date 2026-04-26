/**
 * Sets up the demo environment:
 * 1. William & Danielle → read_only on Francis Distillery (private, Ryan manages)
 * 2. Creates Demo Distillery with 500 realistic barrels
 * 3. Gives William & Danielle full_access to Demo (so they can explore)
 *
 * Run: node scripts/setup-demo.mjs
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xhifzhnxngrnpnnadwrv.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWZ6aG54bmdybnBubmFkd3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2NTI2MCwiZXhwIjoyMDkyNjQxMjYwfQ.pa6X_ynMEx-z9yJzQzSqFF05i7U_SZMspoCM2iVoSyE'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Barrel generation helpers ───────────────────────────────────────────────

const MASH_BILLS = [
  { recipe: '75% Corn, 21% Rye, 4% Malt', grains: ['High Rye', 'Corn'], baseTags: ['rye spice', 'pepper', 'vanilla'] },
  { recipe: '51% Corn, 45% Wheat, 4% Malt', grains: ['Wheat', 'Corn'], baseTags: ['honey', 'soft', 'wheat', 'caramel'] },
  { recipe: '60% Corn, 36% Rye, 4% Malt', grains: ['High Rye', 'Corn'], baseTags: ['bold rye', 'cinnamon', 'oak'] },
  { recipe: '80% Corn, 10% Rye, 10% Malt', grains: ['Corn', 'Heirloom Corn'], baseTags: ['sweet corn', 'vanilla', 'caramel', 'light'] },
  { recipe: '51% Corn, 35% Rye, 14% Malt', grains: ['High Rye', 'Malted Rye'], baseTags: ['complex', 'spice', 'floral'] },
  { recipe: '70% Corn, 26% Rye, 4% Malt', grains: ['Rye', 'Corn'], baseTags: ['floral', 'fruity', 'light rye'] },
  { recipe: '65% Corn, 30% Rye, 5% Malt', grains: ['High Rye'], baseTags: ['bold', 'leather', 'oak dominant'] },
  { recipe: 'Four Grain 60/20/10/10', grains: ['Four Grain'], baseTags: ['complex', 'nutmeg', 'balanced'] },
]

const SOURCES = [
  'MGP', 'Buffalo Trace', 'Heaven Hill', 'Willett', 'New Riff',
  'Wild Turkey', 'Four Roses', 'Beam', 'Castle & Key',
  'Limestone Branch', 'Wilderness Trail', 'Smooth Ambler',
]

const FINISHES = [
  { type: 'none', weight: 60, tags: [] },
  { type: 'Port Finish', weight: 8, tags: ['port', 'dark fruit', 'cherry'] },
  { type: 'Sherry Finish', weight: 8, tags: ['sherry', 'dried fruit', 'nutmeg'] },
  { type: 'Rum Finish', weight: 6, tags: ['rum', 'tropical', 'brown sugar'] },
  { type: 'Wine Finish', weight: 6, tags: ['wine', 'grape', 'tannin'] },
  { type: 'Double Oaked', weight: 7, tags: ['oak dominant', 'vanilla', 'tannin'] },
  { type: 'Toasted Finish', weight: 5, tags: ['toast', 'smoke', 'roasted grain'] },
]

const AGING_TAGS = ['vanilla', 'caramel', 'oak', 'toffee', 'dried fruit', 'leather', 'tobacco']
const FLORAL_TAGS = ['floral', 'fruity', 'light', 'fresh', 'citrus']

const ROWS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'J', 'K', 'L', 'M', 'N', 'P', 'R']
const STATUS_WEIGHTS = [
  { status: 'aging', weight: 58 },
  { status: 'ready', weight: 22 },
  { status: 'bottled', weight: 15 },
  { status: 'dumped', weight: 5 },
]

const NOTES_POOL = [
  'Strong vanilla on the nose. Developing nicely.',
  'Beautiful color. Oak influence increasing each visit.',
  'Spice forward — rye character coming through clearly.',
  'Honey and wheat dominate. Very approachable.',
  'Dark fruit notes developing. Patience required.',
  'Peak approaching. Schedule tasting next quarter.',
  'Excellent barrel. Top candidate for single barrel release.',
  'Lighter than expected. May need more time.',
  'Complex layering — fruit, spice, and oak in balance.',
  'Tropical notes from the finish barrel really shining.',
  'Bold and assertive. Could handle additional aging.',
  'Delicate and refined. Handle with care.',
  null, null, null,
]

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }
function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randFloat(min, max, decimals = 1) { return parseFloat((Math.random() * (max - min) + min).toFixed(decimals)) }

function weightedPick(items) {
  const total = items.reduce((s, i) => s + i.weight, 0)
  let r = Math.random() * total
  for (const item of items) { r -= item.weight; if (r <= 0) return item }
  return items[items.length - 1]
}

function randomDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1).getTime()
  const end = new Date(endYear, 11, 31).getTime()
  const d = new Date(start + Math.random() * (end - start))
  return d.toISOString().split('T')[0]
}

function peakDate(entryDate, ageMonths) {
  const d = new Date(entryDate)
  d.setMonth(d.getMonth() + ageMonths)
  return d.toISOString().split('T')[0]
}

function generateBarrel(index, distilleryId) {
  const mashBill = pick(MASH_BILLS)
  const finishObj = weightedPick(FINISHES)
  const statusObj = weightedPick(STATUS_WEIGHTS)

  const entryYear = statusObj.status === 'bottled' || statusObj.status === 'dumped' ? rand(2015, 2021) : rand(2019, 2023)
  const entryDate = randomDate(entryYear, entryYear)
  const entryProof = rand(100, 130)
  const ageMonthsSoFar = Math.round((Date.now() - new Date(entryDate).getTime()) / (1000 * 60 * 60 * 24 * 30))
  const peakMonths = rand(36, 72)
  const currentProof = Math.max(85, entryProof - rand(5, 20))

  const tags = [
    ...mashBill.baseTags.slice(0, rand(2, 3)),
    ...finishObj.tags.slice(0, rand(0, finishObj.tags.length)),
    ...(ageMonthsSoFar > 36 ? [pick(AGING_TAGS)] : [pick(FLORAL_TAGS)]),
  ].filter((v, i, a) => a.indexOf(v) === i).slice(0, 6)

  const row = pick(ROWS)
  const slot = rand(1, 30)
  const tier = rand(1, 5)

  return {
    distillery_id: distilleryId,
    barrel_number: `DEMO-${String(index).padStart(3, '0')}`,
    mash_bill: mashBill.recipe,
    grain_type: mashBill.grains,
    distillery_source: pick(SOURCES),
    entry_date: entryDate,
    entry_proof: entryProof,
    current_proof_estimate: currentProof,
    warehouse_row: row,
    warehouse_slot: slot,
    warehouse_tier: tier,
    status: statusObj.status,
    finish_type: finishObj.type,
    tags,
    angels_share_pct: parseFloat((ageMonthsSoFar * 0.02).toFixed(2)),
    predicted_peak_date: peakDate(entryDate, peakMonths),
    profile_match_score: rand(45, 96),
    notes: pick(NOTES_POOL),
  }
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function getUserByEmail(email) {
  const { data } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  return data?.users?.find(u => u.email === email)
}

async function main() {
  const { data: allUsers } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const users = allUsers?.users || []

  const william = users.find(u => u.email === 'william.francis@francisdistillery.com')
  const danielle = users.find(u => u.email === 'danielle.francis@francisdistillery.com')

  if (!william || !danielle) {
    console.error('William or Danielle not found — run seed-users.mjs first')
    process.exit(1)
  }

  // ── Step 1: Francis Distillery — set William & Danielle to read_only ──────
  console.log('=== Step 1: Lock down Francis Distillery ===')
  const { data: francisDist } = await supabase.from('distilleries').select('id').eq('owner_id', william.id).single()

  if (francisDist) {
    for (const u of [william, danielle]) {
      const { error } = await supabase.from('user_roles').upsert(
        { user_id: u.id, distillery_id: francisDist.id, role: 'read_only' },
        { onConflict: 'user_id,distillery_id' }
      )
      console.log(error ? `  ${u.email} read_only FAILED: ${error.message}` : `  ${u.email} → read_only ✓`)
    }
  } else {
    console.log('  Francis Distillery not found')
  }

  // ── Step 2: Create Demo Distillery ────────────────────────────────────────
  console.log('\n=== Step 2: Create Demo Distillery ===')

  // Demo owner is a system account
  let demoOwner = users.find(u => u.email === 'demo-system@stilldemo.com')
  if (!demoOwner) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'demo-system@stilldemo.com',
      password: 'DemoSystem2024!',
      email_confirm: true,
      user_metadata: { display_name: 'Demo System', username: 'SYSTEM' },
    })
    if (error) { console.error('Failed to create demo owner:', error.message); process.exit(1) }
    demoOwner = data.user
    console.log(`  Demo system user created (${demoOwner.id})`)
  } else {
    console.log(`  Demo system user exists (${demoOwner.id})`)
  }

  let demoDistilleryId
  const { data: existingDemo } = await supabase.from('distilleries').select('id').eq('owner_id', demoOwner.id).single()
  if (existingDemo) {
    demoDistilleryId = existingDemo.id
    console.log(`  Demo Distillery exists (${demoDistilleryId})`)
  } else {
    const { data, error } = await supabase.from('distilleries').insert({
      name: 'Demo Distillery',
      location: 'Bardstown, KY',
      owner_id: demoOwner.id,
    }).select('id').single()
    if (error) { console.error('Failed to create demo distillery:', error.message); process.exit(1) }
    demoDistilleryId = data.id
    console.log(`  Demo Distillery created (${demoDistilleryId})`)
  }

  // ── Step 3: Seed 500 demo barrels ─────────────────────────────────────────
  console.log('\n=== Step 3: Seed 500 demo barrels ===')
  const { data: existingBarrels } = await supabase.from('barrels').select('id').eq('distillery_id', demoDistilleryId)

  if (existingBarrels && existingBarrels.length >= 100) {
    console.log(`  Already has ${existingBarrels.length} barrels — skipping`)
  } else {
    const barrels = Array.from({ length: 500 }, (_, i) => generateBarrel(i + 1, demoDistilleryId))

    // Insert in batches of 50
    let inserted = 0
    for (let i = 0; i < barrels.length; i += 50) {
      const batch = barrels.slice(i, i + 50)
      const { error } = await supabase.from('barrels').insert(batch)
      if (error) console.error(`  Batch ${i / 50 + 1} FAILED: ${error.message}`)
      else { inserted += batch.length; process.stdout.write(`  ${inserted}/500\r`) }
    }
    console.log(`\n  500 barrels seeded ✓`)
  }

  // ── Step 4: Give William & Danielle full_access to Demo ───────────────────
  console.log('\n=== Step 4: Grant Demo access to William & Danielle ===')
  for (const u of [william, danielle]) {
    const { error } = await supabase.from('user_roles').upsert(
      { user_id: u.id, distillery_id: demoDistilleryId, role: 'full_access' },
      { onConflict: 'user_id,distillery_id' }
    )
    console.log(error ? `  ${u.email} demo access FAILED: ${error.message}` : `  ${u.email} → full_access on Demo ✓`)
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║              Setup Complete                      ║')
  console.log('╠══════════════════════════════════════════════════╣')
  console.log('║  Francis Distillery (private)                    ║')
  console.log('║    WFRANCIS  — read only                         ║')
  console.log('║    DFRANCIS  — read only                         ║')
  console.log('║    RRUSSELL  — full access (developer)           ║')
  console.log('║    GASH      — read only                         ║')
  console.log('╠══════════════════════════════════════════════════╣')
  console.log('║  Demo Distillery (500 barrels)                   ║')
  console.log('║    WFRANCIS  — full access (can explore)         ║')
  console.log('║    DFRANCIS  — full access (can explore)         ║')
  console.log('╚══════════════════════════════════════════════════╝')
}

main().catch(e => { console.error(e); process.exit(1) })
