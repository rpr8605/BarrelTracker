import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const updates = await req.json()
  // Remove fields that should not be patched directly
  const { id: _id, distillery_id: _did, created_at: _ca, ...safeUpdates } = updates

  const admin = createServiceClient()

  // Verify ownership
  const { data: record } = await admin.from('cola_records').select('distillery_id').eq('id', params.id).single()
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: dist } = await admin.from('distilleries').select('id').eq('id', record.distillery_id).eq('owner_id', user.id).single()
  if (!dist) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { data, error } = await admin.from('cola_records')
    .update({ ...safeUpdates, updated_at: new Date().toISOString() })
    .eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data: record } = await admin.from('cola_records').select('distillery_id, status').eq('id', params.id).single()
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (record.status !== 'pre_application')
    return NextResponse.json({ error: 'Only pre-application records can be deleted' }, { status: 422 })

  const { data: dist } = await admin.from('distilleries').select('id').eq('id', record.distillery_id).eq('owner_id', user.id).single()
  if (!dist) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const { error } = await admin.from('cola_records').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ deleted: true })
}
