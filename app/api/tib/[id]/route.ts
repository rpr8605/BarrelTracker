import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data, error } = await admin.from('tib_records').select('*').eq('id', params.id).single()
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  // Verify ownership
  const { data: dist } = await admin.from('distilleries').select('owner_id').eq('id', data.distillery_id).single()
  if (!dist || dist.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data: existing } = await admin.from('tib_records').select('distillery_id,status').eq('id', params.id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: dist } = await admin.from('distilleries').select('owner_id').eq('id', existing.distillery_id).single()
  if (!dist || dist.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  // Only allow updating notes, ttb_form_5100_16_serial, status, received_at
  const allowed = ['notes', 'ttb_form_5100_16_serial', 'status', 'received_at']
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (body.status === 'received' && !updates.received_at) {
    updates.received_at = new Date().toISOString()
  }

  const { data, error } = await admin.from('tib_records').update(updates).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data: existing } = await admin.from('tib_records').select('distillery_id,created_at').eq('id', params.id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: dist } = await admin.from('distilleries').select('owner_id').eq('id', existing.distillery_id).single()
  if (!dist || dist.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Only allow delete within 24 hours of creation
  const ageMs = Date.now() - new Date(existing.created_at).getTime()
  if (ageMs > 24 * 60 * 60 * 1000) {
    return NextResponse.json({ error: 'TIB records cannot be deleted after 24 hours — use status cancellation instead' }, { status: 422 })
  }

  const { error } = await admin.from('tib_records').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
