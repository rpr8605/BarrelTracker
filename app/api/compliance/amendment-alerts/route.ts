import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  const status = searchParams.get('status') // pending | acknowledged | resolved
  const countOnly = searchParams.get('count') === 'true'
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })

  const admin = createServiceClient()

  if (countOnly) {
    let countQuery = admin
      .from('amendment_alerts')
      .select('id', { count: 'exact', head: true })
      .eq('distillery_id', distilleryId)
      .eq('status', 'pending')
    const { count, error } = await countQuery
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ count })
  }

  let query = admin
    .from('amendment_alerts')
    .select('*')
    .eq('distillery_id', distilleryId)

  if (status) query = query.eq('status', status)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, status } = await req.json()
  if (!id || !status) return NextResponse.json({ error: 'Missing id or status' }, { status: 400 })
  if (!['acknowledged', 'resolved'].includes(status)) {
    return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data: existing } = await admin.from('amendment_alerts').select('distillery_id').eq('id', id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: dist } = await admin.from('distilleries').select('owner_id').eq('id', existing.distillery_id).single()
  if (!dist || dist.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const updates: Record<string, unknown> = { status }
  if (status === 'acknowledged') updates.acknowledged_at = new Date().toISOString()
  if (status === 'resolved') updates.resolved_at = new Date().toISOString()

  const { data, error } = await admin.from('amendment_alerts').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
