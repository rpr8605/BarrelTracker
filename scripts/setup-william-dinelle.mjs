/**
 * Sets up William (william@william-distillery.com) and Dinelle (danielle@magnolia-spirits.com)
 * for their weekend test:
 *
 * 1. Give both full_access to Demo Distillery (500 barrels — lets them explore all features)
 * 2. Give both cross-access to each other's distilleries (William Francis Distillery ↔ S.N. Pike's Magnolia)
 * 3. Seed ~30 realistic barrels into William Francis Distillery
 * 4. Seed ~30 realistic barrels into S.N. Pike's Magnolia
 *
 * Run: node scripts/setup-william-dinelle.mjs
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://xhifzhnxngrnpnnadwrv.supabase.co'
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaWZ6aG54bmdybnBubmFkd3J2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NzA2NTI2MCwiZXhwIjoyMDkyNjQxMjYwfQ.pa6X_ynMEx-z9yJzQzSqFF05i7U_SZMspoCM2iVoSyE'

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// ─── Barrel generation helpers ───────────────────────────────────────────────

const MASH_BILLS = [
  { recipe: '75% Corn, 21% Rye, 4% Malt', grains: ['High Rye', 'Corn'], flavor: ['rye spice', 'pepper', 'vanilla', 'oak'] },
  { recipe: '51% Corn, 45% Wheat, 4% Malt', grains: ['Wheat', 'Corn'], flavor: ['honey', 'soft', 'wheat', 'caramel'] },
  { recipe: '80% Corn, 10% Rye, 10% Malt', grains: ['Corn'], flavor: ['sweet corn', 'vanilla', 'caramel'] },
  { recipe: '65% Corn, 30% Rye, 5% Malt', grains: ['High Rye'], flavor: ['bold', 'leather', 'oak dominant'] },
]

const COOPERAGE = ['C', 'REC', 'P', 'PAR']
const COOPERAGE_WEIGHTS = [70, 15, 10, 5]

function pickCooperage() {
  const r = Math.random() * 100
  let cum = 0
  for (let i = 0; i < COOPERAGE.length; i++) {
    cum += COOPERAGE_WEIGHTS[i]
    if (r < cum) return COOPERAGE[i]
  }
  return 'C'
}

const SPIRIT_TYPES = [
  { type: 'bourbon', entryProof: 125, cooperageRequired: 'C' },
  { type: 'rye_whiskey', entryProof: 125, cooperageRequired: 'C' },
  { type: 'corn_whiskey', entryProof: 125, cooperageRequired: null },
  { type: 'wheat_whiskey', entryProof: 125, cooperageRequired: 'C' },
]

const STATUSES = ['aging', 'aging', 'aging', 'aging', 'aging', 'aging', 'ready', 'ready']

function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min }
function randFloat(min, max, decimals = 2) { return parseFloat((Math.random() * (max - min) + min).toFixed(decimals)) }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)] }

function makeBarrel(distilleryId, index, rows) {
  const spirit = pick(SPIRIT_TYPES)
  const mash = pick(MASH_BILLS)
  const cooperage = spirit.cooperageRequired ?? pickCooperage()

  const now = new Date()
  const monthsAgo = randInt(6, 48)
  const entryDate = new Date(now)
  entryDate.setMonth(entryDate.getMonth() - monthsAgo)

  const wineGallons = randFloat(50, 53, 2)
  const entryProof = spirit.entryProof

  const row = rows[Math.floor(index / 10) % rows.length]
  const slot = (index % 10) + 1
  const tier = randInt(1, 5)

  const barrelNumber = `${row}${String(slot).padStart(2,'0')}-T${tier}-${String(index + 1).padStart(3,'0')}`
  const status = monthsAgo < 12 ? 'aging' : pick(STATUSES)

  const tags = [...mash.flavor]
  if (monthsAgo > 24) tags.push('aged', 'mature')
  if (monthsAgo > 36) tags.push('complex', 'developed')

  return {
    distillery_id: distilleryId,
    barrel_number: barrelNumber,
    spirits_type: spirit.type,
    mash_bill: mash.recipe,
    cooperage_code: cooperage,
    entry_date: entryDate.toISOString().split('T')[0],
    entry_proof: entryProof,
    wine_gallons: wineGallons,
    warehouse_row: row,
    warehouse_slot: slot,
    warehouse_tier: tier,
    status,
    tags,
    notes: '',
  }
}

async function seedBarrels(distilleryId, distilleryName, count, rowLetters) {
  console.log(`\nSeeding ${count} barrels into ${distilleryName}...`)
  const barrels = Array.from({ length: count }, (_, i) => makeBarrel(distilleryId, i, rowLetters))

  const { data, error } = await supabase.from('barrels').insert(barrels).select('id')
  if (error) {
    console.error(`  ✗ Error: ${error.message}`)
    return false
  }
  console.log(`  ✓ ${data.length} barrels created`)
  return true
}

async function upsertRole(userId, distilleryId, role) {
  const { error } = await supabase.from('user_roles').upsert(
    { user_id: userId, distillery_id: distilleryId, role },
    { onConflict: 'user_id,distillery_id' }
  )
  return !error
}

async function main() {
  console.log('=== Setting up William & Dinelle for weekend test ===\n')

  // Known IDs from current DB state
  const WILLIAM_ID   = '2342b5f6-8179-4a4d-ae5c-3fbd4d1ba99c' // william@william-distillery.com
  const DINELLE_ID   = '3f04487f-f870-4b63-b639-dc7f5048b23c' // danielle@magnolia-spirits.com
  const WILLIAM_DIST = '9a288b94-a86d-4b24-8f1c-a9d4196fb1d6' // William Francis Distillery
  const DINELLE_DIST = '8b4bf0c4-ce90-4254-96ae-643a34098929' // S.N. Pike's Magnolia
  const DEMO_DIST    = 'fcc8af1f-8720-44c8-9d7c-df1b9ac06be8' // Demo Distillery (500 barrels)
  const MAGNOLIA_DIST = 'fc8d9ab1-764e-490f-b498-8be1c3cdd2aa' // Magnolia Barrel House (150 barrels)

  // 1. Cross-distillery roles
  console.log('Setting up user_roles...')
  const roleOps = [
    // Demo Distillery — both get full_access
    { uid: WILLIAM_ID, did: DEMO_DIST,    role: 'full_access', label: 'William → Demo Distillery' },
    { uid: DINELLE_ID, did: DEMO_DIST,    role: 'full_access', label: 'Dinelle → Demo Distillery' },
    // Magnolia Barrel House — both get full_access
    { uid: WILLIAM_ID, did: MAGNOLIA_DIST, role: 'full_access', label: 'William → Magnolia Barrel House' },
    { uid: DINELLE_ID, did: MAGNOLIA_DIST, role: 'full_access', label: 'Dinelle → Magnolia Barrel House' },
    // Cross-access to each other's own distilleries
    { uid: WILLIAM_ID, did: DINELLE_DIST, role: 'full_access', label: "William → S.N. Pike's Magnolia" },
    { uid: DINELLE_ID, did: WILLIAM_DIST, role: 'full_access', label: 'Dinelle → William Francis Distillery' },
  ]

  for (const op of roleOps) {
    const ok = await upsertRole(op.uid, op.did, op.role)
    console.log(`  ${ok ? '✓' : '✗'} ${op.label}`)
  }

  // 2. Seed barrels — only if distillery is currently empty
  const { data: williamBarrels } = await supabase
    .from('barrels').select('id', { count: 'exact', head: true })
    .eq('distillery_id', WILLIAM_DIST)
  const { count: williamCount } = williamBarrels ?? { count: 0 }

  const { data: dinelleBarrels } = await supabase
    .from('barrels').select('id', { count: 'exact', head: true })
    .eq('distillery_id', DINELLE_DIST)
  const { count: dinelleCount } = dinelleBarrels ?? { count: 0 }

  if ((williamCount ?? 0) === 0) {
    await seedBarrels(WILLIAM_DIST, 'William Francis Distillery', 30, ['A','B','C','D'])
  } else {
    console.log(`\nWilliam Francis Distillery already has ${williamCount} barrels — skipping seed`)
  }

  if ((dinelleCount ?? 0) === 0) {
    await seedBarrels(DINELLE_DIST, "S.N. Pike's Magnolia", 30, ['A','B','C','D'])
  } else {
    console.log(`\nS.N. Pike's Magnolia already has ${dinelleCount} barrels — skipping seed`)
  }

  // 3. Verify
  console.log('\n=== Verification ===')
  const { data: allRoles } = await supabase
    .from('user_roles')
    .select('user_id, distillery_id, role, distilleries(name)')
    .in('user_id', [WILLIAM_ID, DINELLE_ID])

  const names = { [WILLIAM_ID]: 'William', [DINELLE_ID]: 'Dinelle' }
  for (const r of allRoles ?? []) {
    console.log(`  ${names[r.user_id]}: ${r.distilleries?.name} (${r.role})`)
  }

  // Check owned distilleries
  const { data: owned } = await supabase
    .from('distilleries')
    .select('name, owner_id')
    .in('owner_id', [WILLIAM_ID, DINELLE_ID])
  for (const d of owned ?? []) {
    const name = names[d.owner_id]
    console.log(`  ${name}: ${d.name} (owner)`)
  }

  // Final barrel counts
  const { count: wc } = await supabase
    .from('barrels').select('*', { count: 'exact', head: true }).eq('distillery_id', WILLIAM_DIST)
  const { count: dc } = await supabase
    .from('barrels').select('*', { count: 'exact', head: true }).eq('distillery_id', DINELLE_DIST)
  console.log(`\n  William Francis Distillery: ${wc} barrels`)
  console.log(`  S.N. Pike's Magnolia: ${dc} barrels`)
  console.log('\n✓ Done. Both accounts ready for the weekend test.')
}

main().catch(e => { console.error(e); process.exit(1) })
