/**
 * Creates the Magnolia Barrel House distillery with 150 barrels.
 * Grants WFRANCIS and DFRANCIS full_access to both Francis AND Magnolia.
 * Run: node scripts/setup-magnolia.mjs
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xhifzhnxngrnpnnadwrv.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWZ6aG54bmdybnBubmFkd3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2NTI2MCwiZXhwIjoyMDkyNjQxMjYwfQ.pa6X_ynMEx-z9yJzQzSqFF05i7U_SZMspoCM2iVoSyE'

const sb = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const MASH_BILLS = [
  { recipe: '72% Corn, 18% Rye, 10% Malt', grains: ['High Rye', 'Corn'], tags: ['bold rye', 'vanilla', 'pepper'] },
  { recipe: '60% Corn, 30% Wheat, 10% Malt', grains: ['Wheat', 'Corn'], tags: ['honey', 'soft wheat', 'caramel'] },
  { recipe: '80% Corn, 12% Rye, 8% Malt', grains: ['Corn', 'Heirloom Corn'], tags: ['sweet corn', 'light', 'vanilla'] },
  { recipe: '55% Corn, 40% Rye, 5% Malt', grains: ['High Rye', 'Malted Rye'], tags: ['bold', 'spice', 'complex'] },
  { recipe: 'Four Grain 55/25/10/10', grains: ['Four Grain'], tags: ['balanced', 'nutmeg', 'dried fruit'] },
]
const SOURCES = ['MGP', 'Heaven Hill', 'Limestone Branch', 'New Riff', 'Wilderness Trail', 'Smooth Ambler']
const FINISHES = [
  { type: 'none', w: 65, tags: [] },
  { type: 'Port Finish', w: 10, tags: ['port', 'dark fruit'] },
  { type: 'Sherry Finish', w: 10, tags: ['sherry', 'dried fruit'] },
  { type: 'Double Oaked', w: 8, tags: ['oak dominant', 'tannin'] },
  { type: 'Rum Finish', w: 7, tags: ['rum', 'tropical'] },
]
const ROWS = ['A','B','C','D','E','F','G','H']
const STATUS = [
  { s: 'aging', w: 60 }, { s: 'ready', w: 22 },
  { s: 'bottled', w: 13 }, { s: 'dumped', w: 5 },
]

function pick(a) { return a[Math.floor(Math.random() * a.length)] }
function rand(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a }
function weighted(items) {
  const t = items.reduce((s, i) => s + (i.w || i.weight || 0), 0)
  let r = Math.random() * t
  for (const i of items) { r -= (i.w || i.weight); if (r <= 0) return i }
  return items[items.length - 1]
}
function date(y) {
  const s = new Date(y, 0, 1).getTime()
  const e = new Date(y, 11, 31).getTime()
  return new Date(s + Math.random() * (e - s)).toISOString().split('T')[0]
}
function peak(entry, months) {
  const d = new Date(entry)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

function makeBarrel(i, distilleryId) {
  const mb = pick(MASH_BILLS)
  const fin = weighted(FINISHES)
  const stat = weighted(STATUS)
  const entryYear = stat.s === 'bottled' || stat.s === 'dumped' ? rand(2016, 2021) : rand(2020, 2023)
  const entry = date(entryYear)
  const ep = rand(108, 128)
  const tags = [...mb.tags.slice(0, rand(2, 3)), ...fin.tags].filter((v, i, a) => a.indexOf(v) === i).slice(0, 5)
  return {
    distillery_id: distilleryId,
    barrel_number: `MAG-${String(i).padStart(3, '0')}`,
    mash_bill: mb.recipe,
    grain_type: mb.grains,
    distillery_source: pick(SOURCES),
    entry_date: entry,
    entry_proof: ep,
    current_proof_estimate: Math.max(88, ep - rand(5, 18)),
    warehouse_row: pick(ROWS),
    warehouse_slot: rand(1, 20),
    warehouse_tier: rand(1, 5),
    status: stat.s,
    finish_type: fin.type,
    tags,
    predicted_peak_date: peak(entry, rand(36, 66)),
    profile_match_score: rand(50, 95),
  }
}

async function main() {
  const { data: allUsers } = await sb.auth.admin.listUsers({ perPage: 1000 })
  const users = allUsers?.users || []
  const william = users.find(u => u.email === 'william.francis@francisdistillery.com')
  const danielle = users.find(u => u.email === 'danielle.francis@francisdistillery.com')
  const ryan = users.find(u => u.email === 'ryan.russell@francisdistillery.com')

  // ── Create Magnolia system owner ──────────────────────────────────────────
  let magOwner = users.find(u => u.email === 'magnolia-system@stilldemo.com')
  if (!magOwner) {
    const { data } = await sb.auth.admin.createUser({
      email: 'magnolia-system@stilldemo.com',
      password: 'MagnoliaSystem2024!',
      email_confirm: true,
    })
    magOwner = data.user
    console.log('Magnolia system user created')
  } else {
    console.log('Magnolia system user exists')
  }

  // ── Create Magnolia Distillery ────────────────────────────────────────────
  let magId
  const { data: existMag } = await sb.from('distilleries').select('id').eq('owner_id', magOwner.id).single()
  if (existMag) {
    magId = existMag.id
    console.log(`Magnolia Barrel House exists (${magId})`)
  } else {
    const { data } = await sb.from('distilleries').insert({
      name: 'Magnolia Barrel House',
      location: 'Louisville, KY',
      owner_id: magOwner.id,
    }).select('id').single()
    magId = data.id
    console.log(`Magnolia Barrel House created (${magId})`)
  }

  // ── Seed 150 barrels ──────────────────────────────────────────────────────
  const { data: existing } = await sb.from('barrels').select('id').eq('distillery_id', magId)
  if (existing?.length >= 50) {
    console.log(`${existing.length} Magnolia barrels already exist — skipping`)
  } else {
    const barrels = Array.from({ length: 150 }, (_, i) => makeBarrel(i + 1, magId))
    for (let i = 0; i < barrels.length; i += 50) {
      const { error } = await sb.from('barrels').insert(barrels.slice(i, i + 50))
      if (error) console.error('Insert error:', error.message)
    }
    console.log('150 Magnolia barrels seeded ✓')
  }

  // ── Grant WFRANCIS & DFRANCIS full_access to Magnolia ────────────────────
  // Also update Francis roles from read_only → full_access for these two
  const { data: francisDist } = await sb.from('distilleries').select('id').eq('name', 'Francis Distillery').single()

  for (const u of [william, danielle].filter(Boolean)) {
    // Full access on Magnolia
    await sb.from('user_roles').upsert(
      { user_id: u.id, distillery_id: magId, role: 'full_access' },
      { onConflict: 'user_id,distillery_id' }
    )
    // Full access on Francis (upgrade from read_only)
    if (francisDist) {
      await sb.from('user_roles').upsert(
        { user_id: u.id, distillery_id: francisDist.id, role: 'full_access' },
        { onConflict: 'user_id,distillery_id' }
      )
    }
    console.log(`${u.email} → full_access on Francis + Magnolia ✓`)
  }

  // Ryan keeps full_access on Francis, add him to Magnolia too as admin
  if (ryan && francisDist) {
    await sb.from('user_roles').upsert(
      { user_id: ryan.id, distillery_id: magId, role: 'full_access' },
      { onConflict: 'user_id,distillery_id' }
    )
    console.log('RRUSSELL → full_access on Magnolia ✓')
  }

  console.log('\n╔══════════════════════════════════════════════════╗')
  console.log('║            Magnolia Setup Complete               ║')
  console.log('╠══════════════════════════════════════════════════╣')
  console.log('║  Francis Distillery                              ║')
  console.log('║    WFRANCIS  — full access                       ║')
  console.log('║    DFRANCIS  — full access                       ║')
  console.log('║    RRUSSELL  — full access                       ║')
  console.log('╠══════════════════════════════════════════════════╣')
  console.log('║  Magnolia Barrel House (150 barrels)             ║')
  console.log('║    WFRANCIS  — full access                       ║')
  console.log('║    DFRANCIS  — full access                       ║')
  console.log('║    RRUSSELL  — full access                       ║')
  console.log('╠══════════════════════════════════════════════════╣')
  console.log('║  Demo Distillery (500 barrels)                   ║')
  console.log('║    WFRANCIS  — full access                       ║')
  console.log('║    DFRANCIS  — full access                       ║')
  console.log('║    GASH      — read only                         ║')
  console.log('╚══════════════════════════════════════════════════╝')
}

main().catch(e => { console.error(e); process.exit(1) })
