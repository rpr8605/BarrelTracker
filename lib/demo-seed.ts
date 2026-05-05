import type { SupabaseClient } from '@supabase/supabase-js'

const BARREL_TYPES = [
  { type: 'Bourbon', mash_bill: '75% Corn, 21% Rye, 4% Malted Barley', grain_type: ['corn', 'rye', 'malted barley'] },
  { type: 'Wheated Bourbon', mash_bill: '70% Corn, 20% Wheat, 10% Malted Barley', grain_type: ['corn', 'wheat', 'malted barley'] },
  { type: 'Single Malt', mash_bill: '100% Malted Barley', grain_type: ['malted barley'] },
  { type: 'Rye', mash_bill: '51% Rye, 39% Corn, 10% Malted Barley', grain_type: ['rye', 'corn', 'malted barley'] },
  { type: 'High Rye Bourbon', mash_bill: '60% Corn, 35% Rye, 5% Malted Barley', grain_type: ['corn', 'rye', 'malted barley'] },
]

const DISTILLERS = ['Marcus Webb', 'Clara Holt', 'James Ridgeline']
const FINISH_TYPES = ['none', 'port', 'sherry', 'madeira', 'toasted oak']
const FLAVOR_TAGS = [
  ['vanilla', 'caramel', 'oak'],
  ['dried fruit', 'spice', 'leather'],
  ['honey', 'floral', 'grain'],
  ['smoke', 'chocolate', 'nutmeg'],
  ['citrus', 'mint', 'light oak'],
]

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

function fakeIpHash(i: number): string {
  return Buffer.from(`demo-ip-${i}`).toString('hex').slice(0, 16)
}

export async function seedDemoData(db: SupabaseClient): Promise<{ existing: boolean }> {
  // Check if demo already exists
  const { data: existingDemo } = await db
    .from('distilleries')
    .select('id')
    .eq('slug', 'demo')
    .single()

  if (existingDemo) {
    return { existing: true }
  }

  // Create demo owner account using service role (no real user needed — use a fake uuid)
  const demoOwnerId = '00000000-0000-0000-0000-000000000001'

  // Create demo distillery
  const { data: distillery, error: dErr } = await db
    .from('distilleries')
    .insert({
      name: 'Ridgeline Spirits',
      location: 'Platte County, Missouri',
      owner_id: demoOwnerId,
      slug: 'demo',
      brand_color: '#2D5016',
      is_demo: true,
      plan: 'pro',
      lat: 39.3667,
      lng: -94.7667,
    })
    .select('id')
    .single()

  if (dErr || !distillery) throw new Error(`Failed to create demo distillery: ${dErr?.message}`)

  const dId = distillery.id

  // Build 47 barrels across 3 rickhouses
  type BarrelInsert = {
    distillery_id: string
    barrel_number: string
    mash_bill: string
    grain_type: string[]
    entry_date: string
    entry_proof: number
    current_proof_estimate: number
    warehouse_row: string
    warehouse_slot: number
    warehouse_tier: number
    location_label: string
    status: string
    finish_type: string
    tags: string[]
    notes: string
    angels_share_pct: number
    predicted_peak_date: string | null
  }

  const barrelInserts: BarrelInsert[] = []

  const rickhouses = [
    { row: 'A', count: 12, minAge: 2, maxAge: 8 },
    { row: 'B', count: 18, minAge: 1, maxAge: 12 },
    { row: 'C', count: 17, minAge: 3, maxAge: 6 },
  ]

  let barrelNum = 1
  for (const rh of rickhouses) {
    for (let i = 0; i < rh.count; i++) {
      const ageYears = rh.minAge + Math.random() * (rh.maxAge - rh.minAge)
      const ageDays = Math.floor(ageYears * 365)
      const spec = randomFrom(BARREL_TYPES)
      const proof = 110 + Math.floor(Math.random() * 35)
      const currentProof = Math.max(proof - Math.floor(ageYears * 2), 80)
      const share = Math.min(3 + ageYears * 2.5 + Math.random() * 3, 40)
      const slot = (i % 6) + 1
      const tier = Math.floor(i / 6) + 1
      const num = String(barrelNum).padStart(4, '0')
      const status = ageYears > 7 ? 'ready' : ageYears > 1.5 ? 'aging' : 'aging'
      const peakDate = new Date()
      peakDate.setFullYear(peakDate.getFullYear() + Math.ceil(8 - ageYears))

      barrelInserts.push({
        distillery_id: dId,
        barrel_number: num,
        mash_bill: spec.mash_bill,
        grain_type: spec.grain_type,
        entry_date: daysAgo(ageDays),
        entry_proof: proof,
        current_proof_estimate: currentProof,
        warehouse_row: rh.row,
        warehouse_slot: slot,
        warehouse_tier: tier,
        location_label: `Rickhouse ${rh.row}, Bay ${slot}, Level ${tier}`,
        status,
        finish_type: Math.random() > 0.7 ? randomFrom(FINISH_TYPES.slice(1)) : 'none',
        tags: randomFrom(FLAVOR_TAGS),
        notes: `${spec.type} distilled by ${randomFrom(DISTILLERS)}. Entry proof ${proof}.`,
        angels_share_pct: Math.round(share * 10) / 10,
        predicted_peak_date: status === 'aging' ? peakDate.toISOString().split('T')[0] : null,
      })
      barrelNum++
    }
  }

  const { data: barrels, error: bErr } = await db
    .from('barrels')
    .insert(barrelInserts)
    .select('id, barrel_number, status')

  if (bErr || !barrels) throw new Error(`Failed to create demo barrels: ${bErr?.message}`)

  // Create sponsorships for 3 barrels
  const barrel8 = barrels.find((b) => b.barrel_number === '0008')
  const barrel23 = barrels.find((b) => b.barrel_number === '0023')
  const barrel41 = barrels.find((b) => b.barrel_number === '0041')

  const sponsorInserts = []
  if (barrel23) {
    sponsorInserts.push({
      distillery_id: dId,
      barrel_id: barrel23.id,
      tier: 'SUPPORTER',
      sponsor_name: 'Kansas City Whiskey Guild',
      sponsor_email: 'info@kcwhiskeyguild.com',
      amount_cents: 20000,
      platform_fee_cents: 2000,
      status: 'ACTIVE',
    })
  }
  if (barrel41) {
    sponsorInserts.push({
      distillery_id: dId,
      barrel_id: barrel41.id,
      tier: 'SPONSOR',
      sponsor_name: 'Platte County Corporate Gifts',
      sponsor_email: 'corporate@pccg.com',
      amount_cents: 75000,
      platform_fee_cents: 7500,
      status: 'ACTIVE',
    })
  }
  if (barrel8) {
    sponsorInserts.push({
      distillery_id: dId,
      barrel_id: barrel8.id,
      tier: 'PARTNER',
      sponsor_name: 'Midwest Bourbon Society',
      sponsor_email: 'hello@midwestbourbon.org',
      amount_cents: 300000,
      platform_fee_cents: 30000,
      status: 'ACTIVE',
    })
  }

  if (sponsorInserts.length > 0) {
    await db.from('sponsorships').insert(sponsorInserts)
  }

  // Create fake QR events (340 across last 90 days)
  const qrEvents = []
  for (let i = 0; i < 340; i++) {
    const barrel = barrels[Math.floor(Math.random() * barrels.length)]
    const daysBack = Math.floor(Math.random() * 90)
    const scannedAt = new Date()
    scannedAt.setDate(scannedAt.getDate() - daysBack)
    qrEvents.push({
      distillery_id: dId,
      barrel_id: barrel.id,
      session_id: fakeIpHash(i),
      state: Math.random() > 0.3 ? 'PRE_CLAIM' : 'CLAIMED',
      ip_hash: fakeIpHash(i + 1000),
      user_agent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
      scanned_at: scannedAt.toISOString(),
    })
  }

  // Insert QR events in batches of 50
  for (let i = 0; i < qrEvents.length; i += 50) {
    await db.from('barrel_qr_events').insert(qrEvents.slice(i, i + 50))
  }

  return { existing: false }
}
