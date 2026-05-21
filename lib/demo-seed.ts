import type { SupabaseClient } from '@supabase/supabase-js'

const BARREL_TYPES = [
  { type: 'Bourbon', mash_bill: '75% Corn, 21% Rye, 4% Malted Barley', spirit_type: 'bourbon' },
  { type: 'Wheated Bourbon', mash_bill: '70% Corn, 20% Wheat, 10% Malted Barley', spirit_type: 'bourbon' },
  { type: 'Single Malt', mash_bill: '100% Malted Barley', spirit_type: 'malt_whiskey' },
  { type: 'Rye', mash_bill: '95% Rye, 5% Malted Barley', spirit_type: 'rye_whiskey' },
  { type: 'High Rye Bourbon', mash_bill: '60% Corn, 35% Rye, 5% Malted Barley', spirit_type: 'bourbon' },
]

const DSP_SOURCES = ['DSP-KY-12', 'DSP-TN-04', 'DSP-IN-150', 'HEARTH-01']
const DISTILLERS = ['Gareth', 'William', 'External Source']

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString()
}

export async function seedDemoData(db: SupabaseClient): Promise<{ existing: boolean }> {
  // Check if demo already exists
  const { data: existingDemo } = await db
    .from('distilleries')
    .select('id')
    .eq('slug', 'hearth-hollow')
    .single()

  if (existingDemo) {
    // If it exists, we could delete or update, but for "YOLO" we'll delete and fresh seed to ensure consistency
    await db.from('distilleries').delete().eq('id', existingDemo.id)
  }

  // Create demo owner account using service role (fake uuid)
  const demoOwnerId = '00000000-0000-0000-0000-000000000001'

  // Create demo distillery
  const { data: distillery, error: dErr } = await db
    .from('distilleries')
    .insert({
      name: 'Hearth & Hollow Distilling Co.',
      location: 'Nashville, Tennessee',
      owner_id: demoOwnerId,
      slug: 'hearth-hollow',
      brand_color: '#BA7517',
      is_demo: true,
      plan: 'enterprise',
      dsp_number: 'DSP-TN-2026',
    })
    .select('id')
    .single()

  if (dErr || !distillery) throw new Error(`Failed to create demo distillery: ${dErr?.message}`)
  const dId = distillery.id

  // 1. Seed Barrels (600)
  const barrelInserts = []
  const rackhouses = ['A', 'B', 'C']
  
  for (let i = 1; i <= 600; i++) {
    const rh = randomFrom(rackhouses)
    const row = String(Math.floor(Math.random() * 12) + 1)
    const tier = Math.floor(Math.random() * 6) + 1
    const slot = Math.floor(Math.random() * 20) + 1
    const ageYears = Math.random() * 12
    const spec = randomFrom(BARREL_TYPES)
    const entryProof = 110 + Math.floor(Math.random() * 20)
    
    // Status distribution
    let status: 'aging' | 'ready' | 'bottled' | 'dumped' = 'aging'
    if (ageYears > 8 && Math.random() > 0.7) status = 'ready'
    if (i > 580) status = 'dumped'

    barrelInserts.push({
      distillery_id: dId,
      barrel_number: `H&H-${String(i).padStart(4, '0')}`,
      mash_bill: spec.mash_bill,
      spirits_type: spec.spirit_type,
      distillery_source: randomFrom(DSP_SOURCES),
      entry_date: daysAgo(Math.floor(ageYears * 365)),
      entry_proof: entryProof,
      current_proof_estimate: Math.max(entryProof - (ageYears * 1.5), 80),
      warehouse_row: row,
      warehouse_slot: slot,
      warehouse_tier: tier,
      location_label: `Rackhouse ${rh}, Row ${row}, Tier ${tier}, Slot ${slot}`,
      status: status,
      notes: i === 104 ? 'Flagship Barrel. Needs final tasting note.' : null,
      nfc_tag_id: i <= 587 ? `TAG-${dId}-${i}` : null,
    })

    // Batch in 100s to avoid payload limits
    if (barrelInserts.length === 100) {
      await db.from('barrels').insert(barrelInserts)
      barrelInserts.length = 0
    }
  }
  if (barrelInserts.length > 0) {
    await db.from('barrels').insert(barrelInserts)
  }

  // Get some barrel IDs for linking
  const { data: seededBarrels } = await db.from('barrels').select('id, barrel_number').eq('distillery_id', dId)
  const b104 = seededBarrels?.find(b => b.barrel_number === 'H&H-0104')

  // 2. Batches (8 active)
  const { data: batches } = await db.from('batches').insert([
    { distillery_id: dId, batch_number: 'BATCH-2026-001', status: 'active', spirits_type: 'bourbon' },
    { distillery_id: dId, batch_number: 'BATCH-2026-002', status: 'active', spirits_type: 'rye_whiskey' },
    { distillery_id: dId, batch_number: 'BATCH-2026-003', status: 'active', spirits_type: 'bourbon' },
    { distillery_id: dId, batch_number: 'BATCH-2026-004', status: 'active', spirits_type: 'malt_whiskey' },
    { distillery_id: dId, batch_number: 'BATCH-2026-005', status: 'active', spirits_type: 'bourbon' },
    { distillery_id: dId, batch_number: 'BATCH-2026-006', status: 'active', spirits_type: 'rye_whiskey' },
    { distillery_id: dId, batch_number: 'BATCH-2026-007', status: 'active', spirits_type: 'bourbon' },
    { distillery_id: dId, batch_number: 'BATCH-2026-008', status: 'active', spirits_type: 'bourbon' },
  ]).select()

  // 3. Blends (3 active)
  const { data: blends } = await db.from('blend_batches').insert([
    { distillery_id: dId, blend_name: 'Founder\'s Rye Blend', status: 'active', target_proof: 100, notes: 'Blocked by missing proof target' },
    { distillery_id: dId, blend_name: 'Spring Equinox', status: 'active', target_proof: 112 },
    { distillery_id: dId, blend_name: 'Highland Sunset', status: 'active', target_proof: 94 },
  ]).select()

  // 4. Releases (4 active)
  const { data: releases } = await db.from('bottling_runs').insert([
    { distillery_id: dId, label_name: 'Spring Single Barrel', status: 'planned', bottle_count: 186, bottling_date: daysAgo(-10), blend_batch_id: blends?.[0]?.id },
    { distillery_id: dId, label_name: 'Founder\'s Rye', status: 'planned', bottle_count: 1200, bottling_date: daysAgo(-20), blend_batch_id: blends?.[0]?.id },
    { distillery_id: dId, label_name: 'Private Barrel #12', status: 'planned', bottle_count: 210, bottling_date: daysAgo(-5) },
    { distillery_id: dId, label_name: 'Missouri Craft Loop', status: 'planned', bottle_count: 500, bottling_date: daysAgo(-30) },
  ]).select()

  // 5. Action Center Items
  await db.from('action_center_items').insert([
    { 
      distillery_id: dId, 
      module: 'operations', 
      title: 'Missing proof target approval', 
      description: 'Founder\'s Rye Blend (BL-007) is blocked.', 
      severity: 'critical',
      entity_type: 'blend',
      entity_id: blends?.[0]?.id
    },
    { 
      distillery_id: dId, 
      module: 'compliance', 
      title: 'COLA confirmation needed', 
      description: 'Spring Single Barrel needs COLA confirmation before bottling.', 
      severity: 'high',
      entity_type: 'release',
      entity_id: releases?.[0]?.id
    },
    { 
      distillery_id: dId, 
      module: 'barrel_repository', 
      title: 'Final tasting note needed', 
      description: 'Barrel H&H-0104 needs a final tasting note before bottling.', 
      severity: 'medium',
      entity_type: 'barrel',
      entity_id: b104?.id
    },
    { 
      distillery_id: dId, 
      module: 'finance', 
      title: 'Inventory valuation stale', 
      description: 'Q2 valuation needs refresh.', 
      severity: 'low'
    }
  ])

  // 6. Report Snapshots
  await db.from('report_snapshots').insert([
    {
      distillery_id: dId,
      report_type: 'daily_executive_summary',
      generated_at: daysAgo(0),
      summary: 'Productivity Snapshot: 31 actions logged, 7 tasks completed, 9 barrels updated.',
      metrics_json: { actions: 31, tasks: 7, barrels: 9, blockers: 2 },
      good_changes: { title: 'Spring Single Barrel moved to final review' },
      warnings: { title: 'B-104 needs final tasting note' }
    }
  ])

  // 7. Saved Views
  await db.from('saved_barrel_views').insert([
    { distillery_id: dId, name: 'MGP Barrels', filter_json: { source: 'DSP-IN-150' }, is_pinned: true },
    { distillery_id: dId, name: '10+ Year Barrels', filter_json: { age_min: 10 }, is_pinned: true },
    { distillery_id: dId, name: 'Ready for Review', filter_json: { status: 'ready' }, is_pinned: true },
    { distillery_id: dId, name: 'Private Barrel Candidates', filter_json: { quality: 'high' }, is_pinned: false },
  ])

  // 8. Custom Barrel Lists
  const { data: list } = await db.from('custom_barrel_lists').insert({
    distillery_id: dId,
    name: 'William\'s MGP Picks',
    description: 'Candidates for the premium 10Y rye blend.'
  }).select().single()

  if (list && seededBarrels) {
    const mgpBarrels = seededBarrels.filter(b => Math.random() > 0.9).slice(0, 5)
    await db.from('custom_barrel_list_items').insert(
      mgpBarrels.map(b => ({ list_id: list.id, barrel_id: b.id, notes: 'Great nose, sample again.' }))
    )
  }

  // 9. Marketing Campaigns
  await db.from('marketing_campaigns').insert([
    { distillery_id: dId, name: 'Share-a-Barrel', status: 'active', goals: 'Drive consumer engagement via QR scans.', metrics_json: { scans: 420, signups: 85 } },
    { distillery_id: dId, name: 'Veterans Trail', status: 'active', metrics_json: { checkins: 156 } },
    { distillery_id: dId, name: 'Missouri Distiller Trail', status: 'active', metrics_json: { checkins: 89 } },
    { distillery_id: dId, name: 'Founder\'s Rye Launch', status: 'draft' },
  ])

  return { existing: false }
}
