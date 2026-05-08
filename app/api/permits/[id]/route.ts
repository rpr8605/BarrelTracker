import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { fireTrigger } from '@/lib/ttb/amendment-triggers'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data: existing } = await admin.from('dsp_documents').select('distillery_id,title,expiration_date').eq('id', params.id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: dist } = await admin.from('distilleries').select('owner_id').eq('id', existing.distillery_id).single()
  if (!dist || dist.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { data, error } = await admin
    .from('dsp_documents')
    .update({ ...body, updated_at: new Date().toISOString() })
    .eq('id', params.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Re-check expiration alerts if expiration_date changed
  const newExpiry = body.expiration_date ?? existing.expiration_date
  if (newExpiry && body.expiration_date) {
    const daysLeft = Math.ceil((new Date(newExpiry).getTime() - Date.now()) / 86_400_000)
    if (daysLeft >= 0 && daysLeft <= 90) {
      await fireTrigger({
        distilleryId: existing.distillery_id,
        alertType: 'permit_expiring',
        title: `Permit Expiring Soon: ${existing.title}`,
        description: `This document expires on ${newExpiry} (${daysLeft} days). Renew before expiration to maintain authority.`,
        relatedId: params.id,
        relatedType: 'dsp_document',
        severity: daysLeft <= 30 ? 'critical' : 'warning',
        supabase: admin,
      })
    }
  }

  return NextResponse.json(data)
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createServiceClient()
  const { data: existing } = await admin.from('dsp_documents').select('distillery_id').eq('id', params.id).single()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const { data: dist } = await admin.from('distilleries').select('owner_id').eq('id', existing.distillery_id).single()
  if (!dist || dist.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { error } = await admin.from('dsp_documents').delete().eq('id', params.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
