import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const batchId = params.id

  // Auth check
  const supabase = createServerSupabaseClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Parse body
  const body = await req.json().catch(() => ({}))
  const count = typeof body.count === 'number' ? Math.floor(body.count) : 0
  if (count < 1 || count > 10000) {
    return NextResponse.json({ error: 'count must be between 1 and 10000' }, { status: 400 })
  }

  // Fetch batch to get distillery_id and verify access
  const { data: batch, error: batchErr } = await supabase
    .from('batches')
    .select('id, distillery_id, bottled_date, bottle_count')
    .eq('id', batchId)
    .single()

  if (batchErr || !batch) {
    return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
  }

  // Check write access via helper function
  const { data: writableIds } = await supabase.rpc('distilleries_i_can_write')
  const canWrite = Array.isArray(writableIds) && writableIds.includes(batch.distillery_id)
  if (!canWrite) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use service client to insert bottle records (bypasses RLS for bulk insert)
  const service = createServiceClient()

  // Build bottle rows
  const rows = Array.from({ length: count }, (_, i) => ({
    batch_id: batchId,
    distillery_id: batch.distillery_id,
    bottle_number: i + 1,
  }))

  // Insert in chunks of 500 to stay under Supabase payload limits
  const CHUNK = 500
  for (let i = 0; i < rows.length; i += CHUNK) {
    const chunk = rows.slice(i, i + CHUNK)
    const { error: insertErr } = await service.from('bottles').insert(chunk)
    if (insertErr) {
      return NextResponse.json({ error: insertErr.message }, { status: 500 })
    }
  }

  // Set bottled_date if not already set
  if (!batch.bottled_date) {
    const today = new Date().toISOString().split('T')[0]
    await service.from('batches').update({ bottled_date: today, bottle_count: count }).eq('id', batchId)
  }

  return NextResponse.json({ ok: true, bottleCount: count })
}
