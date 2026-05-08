import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { calcProofGallons } from '@/lib/ttb'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { distillery_id, period } = await req.json()
  if (!distillery_id || !period) return NextResponse.json({ error: 'Missing distillery_id or period' }, { status: 400 })

  const admin = createServiceClient()
  const periodStart = new Date(period)
  const periodEnd = new Date(periodStart.getFullYear(), periodStart.getMonth() + 1, 1)
  const prevPeriodStart = new Date(periodStart.getFullYear(), periodStart.getMonth() - 1, 1)

  // All barrels for this distillery with TTB data
  const { data: barrels } = await admin
    .from('barrels')
    .select('id, spirits_type, wine_gallons, current_wine_gallons, entry_proof')
    .eq('distillery_id', distillery_id)

  // All events in this period
  const { data: events } = await admin
    .from('barrel_events')
    .select('*')
    .eq('distillery_id', distillery_id)
    .gte('occurred_at', periodStart.toISOString())
    .lt('occurred_at', periodEnd.toISOString())

  // Previous month's snapshots for beginning inventory
  const { data: prevSnapshots } = await admin
    .from('compliance_snapshots')
    .select('*')
    .eq('distillery_id', distillery_id)
    .eq('period', prevPeriodStart.toISOString().split('T')[0])

  const prevMap = new Map((prevSnapshots || []).map((s) => [s.spirits_type, s]))

  // Group events by spirits type using the barrel's spirits_type
  const barrelTypeMap = new Map((barrels || []).map((b) => [b.id, b.spirits_type ?? 'bourbon']))
  type Bucket = { received_wg: number; received_pg: number; removed_wg: number; removed_pg: number; barrel_ids: Set<string> }
  const buckets = new Map<string, Bucket>()

  function getBucket(type: string): Bucket {
    if (!buckets.has(type)) {
      buckets.set(type, { received_wg: 0, received_pg: 0, removed_wg: 0, removed_pg: 0, barrel_ids: new Set() })
    }
    return buckets.get(type)!
  }

  for (const ev of (events || [])) {
    const sType = barrelTypeMap.get(ev.barrel_id) ?? 'bourbon'
    const bucket = getBucket(sType)
    bucket.barrel_ids.add(ev.barrel_id)
    const pg = ev.proof_gallons ?? (ev.proof != null ? calcProofGallons(ev.wine_gallons, ev.proof) : 0)

    if (['fill', 'transfer_in', 'gain'].includes(ev.event_type)) {
      bucket.received_wg += ev.wine_gallons
      bucket.received_pg += pg
    } else {
      bucket.removed_wg += ev.wine_gallons
      bucket.removed_pg += pg
    }
  }

  // Also count barrels by type for the barrel_count field
  const barrelsByType = new Map<string, number>()
  for (const b of (barrels || [])) {
    const t = b.spirits_type ?? 'bourbon'
    barrelsByType.set(t, (barrelsByType.get(t) ?? 0) + 1)
  }

  const allTypesArr = Array.from(new Set([...Array.from(buckets.keys()), ...Array.from(barrelsByType.keys())]))
  if (allTypesArr.length === 0) allTypesArr.push('bourbon')

  const upserted = []
  for (const sType of allTypesArr) {
    const prev = prevMap.get(sType)
    const beg_wg = prev?.end_wine_gallons ?? 0
    const beg_pg = prev?.end_proof_gallons ?? 0
    const bucket = getBucket(sType)

    const end_wg = beg_wg + bucket.received_wg - bucket.removed_wg
    const end_pg = beg_pg + bucket.received_pg - bucket.removed_pg

    // Discrepancy: reported ending minus calculated ending from physical inventory
    const physical_wg = (barrels || [])
      .filter((b) => (b.spirits_type ?? 'bourbon') === sType)
      .reduce((sum, b) => sum + (b.current_wine_gallons ?? b.wine_gallons ?? 0), 0)

    const discrepancy = physical_wg - end_wg

    const { data: snap, error } = await admin.from('compliance_snapshots').upsert({
      distillery_id,
      period: periodStart.toISOString().split('T')[0],
      spirits_type: sType,
      beg_wine_gallons: beg_wg,
      beg_proof_gallons: beg_pg,
      received_wine_gallons: bucket.received_wg,
      received_proof_gallons: bucket.received_pg,
      removed_wine_gallons: bucket.removed_wg,
      removed_proof_gallons: bucket.removed_pg,
      end_wine_gallons: end_wg,
      end_proof_gallons: end_pg,
      discrepancy_wine_gallons: discrepancy,
      barrel_count: barrelsByType.get(sType) ?? 0,
      status: 'draft',
      generated_at: new Date().toISOString(),
    }, { onConflict: 'distillery_id,period,spirits_type' }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    upserted.push(snap)
  }

  return NextResponse.json(upserted)
}
