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
    { row: 'A', count: 4, minAge: 2, maxAge: 8 },
    { row: 'B', count: 4, minAge: 1, maxAge: 12 },
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
    .select('id, barrel_number, status, mash_bill, distillery_id')

  if (bErr || !barrels) throw new Error(`Failed to create demo barrels: ${bErr?.message}`)

  // Create sponsorships for 3 barrels
  const barrel8 = barrels.find((b) => b.barrel_number === '0008')
  const barrel23 = barrels.find((b) => b.barrel_number === '0023')
  const barrel41 = barrels.find((b) => b.barrel_number === '0041')

  // SPECIFIC FIX: Ensure Barrel #0008 has the requested data
  if (barrel8) {
    const { data: b0008Batch } = await db
      .from('batches')
      .insert({
        distillery_id: dId,
        batch_number: 'B-0008',
        barrel_ids: [barrel8.id],
        story_content: 'Barrel #0008: Single Barrel Rye. This barrel is tracked through Still from fill to final record. Its Smart Tag connects the physical barrel to a live digital record containing production details, compliance documents, scan history, and public/trade views.',
        story_page_public: true,
        story_page_slug: 'barrel-0008',
      })
      .select()
      .single()

    await db.from('barrels').update({
      mash_bill: '95% Rye, 5% Malted Barley',
      entry_proof: 114,
      warehouse_row: 'A',
      warehouse_slot: 4,
      warehouse_tier: 2,
      notes: 'High rye mash bill. Target: Single Barrel Rye release. Aging in Rickhouse A.',
      public_token: 'BRL-0008-DEMO',
      batch_id: b0008Batch?.id,
    }).eq('id', barrel8.id)

    // Add voice notes for Barrel #0008
    await db.from('voice_notes').insert([
      {
        barrel_id: barrel8.id,
        distillery_id: dId,
        transcript: 'Initial fill record created for demo barrel #0008. 95/5 Rye mash bill.',
        ai_extracted_tags: ['rye', 'fill'],
        duration_seconds: 12,
        recorded_at: daysAgo(365),
      },
      {
        barrel_id: barrel8.id,
        distillery_id: dId,
        transcript: 'Sample pulled for sensory review. Light spice, oak, caramel, and rye heat developing.',
        ai_extracted_tags: ['spice', 'oak', 'caramel', 'rye heat'],
        duration_seconds: 18,
        recorded_at: daysAgo(90),
      },
      {
        barrel_id: barrel8.id,
        distillery_id: dId,
        transcript: 'Compliance packet pending state registration verification. Smart Tag assigned for QR/NFC demonstration.',
        ai_extracted_tags: ['compliance', 'smart tag'],
        duration_seconds: 15,
        recorded_at: daysAgo(10),
      }
    ])
  }

  // Nancy's Requested Demo Barrels
  const extraBarrels = [
    {
      distillery_id: dId,
      barrel_number: 'ASM-001',
      mash_bill: '100% Malted Barley',
      grain_type: ['Malted Barley'],
      entry_date: daysAgo(400),
      entry_proof: 110,
      warehouse_row: 'B',
      warehouse_slot: 1,
      warehouse_tier: 1,
      notes: 'Demo malt whiskey support for ASM producers.',
      status: 'aging',
      public_token: 'ASM-001-DEMO',
    },
    {
      distillery_id: dId,
      barrel_number: 'FIN-001',
      mash_bill: '75% Corn, 21% Rye, 4% Malt',
      grain_type: ['Corn', 'Rye', 'Malt'],
      entry_date: daysAgo(730),
      entry_proof: 115,
      warehouse_row: 'A',
      warehouse_slot: 40,
      warehouse_tier: 3,
      finish_type: 'Amburana',
      notes: 'Demonstrates Stills flexible finishing library.',
      status: 'ready',
      public_token: 'FIN-001-DEMO',
    }
  ]
  await db.from('barrels').insert(extraBarrels)

  // Seed "Mustard" as a custom finish for the demo distillery
  await db.from('material_library').insert({
    distillery_id: dId,
    name: 'Mustard',
    normalized_name: 'mustard',
    category: 'finish',
    parent_group: 'Custom',
    notes: 'Nancy requested a weird one.'
  })

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

  // --- NEW PLATFORM UPGRADE SEED DATA ---

  // 1. NPD Projects (2 pilot projects)
  const { data: npdProjects, error: npdErr } = await db
    .from('npd_projects')
    .insert([
      {
        distillery_id: dId,
        project_name: 'Project Honeycomb',
        category: 'Finished Bourbon',
        target_proof: 112,
        status: 'pilot',
        ai_brief: 'A honey-finished bourbon aimed at the premium gift market.',
        created_by: demoOwnerId,
      },
      {
        distillery_id: dId,
        project_name: 'Midnight Rye',
        category: 'Rye Whiskey',
        target_proof: 100,
        status: 'concept',
        ai_brief: 'Dark, chocolatey rye whiskey using heavy char barrels.',
        created_by: demoOwnerId,
      }
    ])
    .select()

  if (npdErr || !npdProjects) throw new Error(`Failed to create NPD projects: ${npdErr?.message}`)

  // 2. Bottle Economics Scenario (in NPD Versions)
  await db.from('npd_versions').insert([
    {
      distillery_id: dId,
      project_id: npdProjects[0].id,
      version_number: 'v1.0',
      formula_notes: 'Honey finish for 3 months in toasted barrels.',
      cost_estimate: 42.50, // "1 bottle economics scenario"
      sensory_notes: 'Strong floral notes, balanced sweetness.',
      created_by: demoOwnerId,
    }
  ])

  // 3. Blend Batch (1 blend batch)
  const blendBarrels = barrels.slice(0, 4) // Use first 4 barrels
  const { data: blendBatch, error: blendErr } = await db
    .from('blend_batches')
    .insert({
      distillery_id: dId,
      blend_name: 'Founder\'s Reserve 2026',
      target_proof: 108,
      target_volume_gallons: 200,
      status: 'active',
      created_by: demoOwnerId,
    })
    .select()
    .single()

  if (blendErr || !blendBatch) throw new Error(`Failed to create blend batch: ${blendErr?.message}`)

  // 4. Blend Batch Components
  const componentInserts = blendBarrels.map(b => ({
    distillery_id: dId,
    blend_batch_id: blendBatch.id,
    source_type: 'barrel',
    source_id: b.id,
    volume_gallons: 50,
    proof: 115,
    created_by: demoOwnerId,
  }))
  await db.from('blend_batch_components').insert(componentInserts)

  // 5. Planned Release (Bottling Run)
  const { data: bottlingRun, error: bottleErr } = await db
    .from('bottling_runs')
    .insert({
      distillery_id: dId,
      blend_batch_id: blendBatch.id,
      bottling_date: daysAgo(-30), // Planned in future
      bottle_size_ml: 750,
      bottle_count: 1000,
      label_name: 'Founder\'s Reserve Batch #1',
      created_by: demoOwnerId,
    })
    .select()
    .single()

  if (bottleErr || !bottlingRun) throw new Error(`Failed to create bottling run: ${bottleErr?.message}`)

  // 6. Audit Readiness Report (Consultant Review on a TTB Report)
  // First create a TTB report to review
  const { data: ttbReport } = await db
    .from('ttb_report_periods')
    .insert({
      distillery_id: dId,
      report_month: daysAgo(30),
      form_5110_40_values: { total_produced: 5000, total_withdrawn: 4200 },
      status: 'draft',
    })
    .select()
    .single()

  if (ttbReport) {
    await db.from('consultant_reviews').insert({
      distillery_id: dId,
      target_type: 'ttb_report',
      target_id: ttbReport.id,
      reviewer_id: demoOwnerId, // In real life would be a consultant
      status: 'approved',
      comments: 'Audit readiness report: All records match production logs. Ready for filing.',
      created_by: demoOwnerId,
    })
  }

  return { existing: false }
}
