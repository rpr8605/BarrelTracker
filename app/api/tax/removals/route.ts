import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { getRateForRemoval, calcWineGallonsFromBottles, calcProofGallonsFromBottles } from '@/lib/ttb/cbma-calculator'
import { removalDateToPeriodKey } from '@/lib/ttb/tax-periods'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })
  const admin = createServiceClient()
  let q = admin.from('tax_determined_removals').select('*').eq('distillery_id', distilleryId).order('removal_date', { ascending: false }).limit(500)
  const from = searchParams.get('from'); const to = searchParams.get('to')
  if (from) q = q.gte('removal_date', from)
  if (to) q = q.lte('removal_date', to)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { distillery_id, removal_date, product_name, spirits_type, destination, cases_removed, bottles_per_case, bottle_size_ml, proof, notes, bottling_record_id } = body
  if (!distillery_id || !removal_date || !cases_removed || !bottle_size_ml || !proof || !destination)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })

  const admin = createServiceClient()
  const bpc = bottles_per_case ?? 12
  const wg = calcWineGallonsFromBottles(cases_removed, bpc, bottle_size_ml)
  const pg = calcProofGallonsFromBottles(cases_removed, bpc, bottle_size_ml, proof)

  // Get YTD proof gallons to determine CBMA rate
  const year = new Date(removal_date).getFullYear()
  const { data: ytdRows } = await admin.from('tax_determined_removals')
    .select('proof_gallons')
    .eq('distillery_id', distillery_id)
    .gte('removal_date', `${year}-01-01`)
    .lt('removal_date', removal_date)
  const ytdPG = (ytdRows ?? []).reduce((s: number, r: { proof_gallons: number }) => s + (r.proof_gallons ?? 0), 0)

  const { at_270, at_1350, tax } = getRateForRemoval(ytdPG, pg)
  // Apply the dominant rate (whichever bucket is larger) as the single rate for this record
  const cbma_rate_applied = at_1350 >= at_270 ? 13.50 : 2.70

  const { data, error } = await admin.from('tax_determined_removals').insert({
    distillery_id, removal_date, product_name, spirits_type, destination,
    cases_removed, bottles_per_case: bpc, bottle_size_ml, proof,
    wine_gallons: wg, proof_gallons: pg,
    cbma_rate_applied, tax_owed: tax,
    tax_period: removalDateToPeriodKey(new Date(removal_date)),
    bottling_record_id: bottling_record_id ?? null,
    notes: notes ?? null,
    transaction_date: removal_date,
    created_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ...data, ytd_pg_before: ytdPG, at_270, at_1350 })
}
