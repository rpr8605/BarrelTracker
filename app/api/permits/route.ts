import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { fireTrigger } from '@/lib/ttb/amendment-triggers'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('dsp_documents')
    .select('*')
    .eq('distillery_id', distilleryId)
    .order('expiration_date', { ascending: true, nullsFirst: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { distillery_id, document_type, document_number, title, issue_date, expiration_date, issuing_authority, status, notes } = body

  if (!distillery_id || !document_type || !title) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data: dist } = await admin.from('distilleries').select('owner_id').eq('id', distillery_id).single()
  if (!dist || dist.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { data, error } = await admin.from('dsp_documents').insert({
    distillery_id, document_type, title,
    document_number: document_number ?? null,
    issue_date: issue_date ?? null,
    expiration_date: expiration_date ?? null,
    issuing_authority: issuing_authority ?? 'TTB',
    status: status ?? 'active',
    notes: notes ?? null,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Fire permit_expiring alert if expiring within 90 days
  if (expiration_date) {
    const daysLeft = Math.ceil((new Date(expiration_date).getTime() - Date.now()) / 86_400_000)
    if (daysLeft >= 0 && daysLeft <= 90) {
      await fireTrigger({
        distilleryId: distillery_id,
        alertType: 'permit_expiring',
        title: `Permit Expiring Soon: ${title}`,
        description: `This document expires on ${expiration_date} (${daysLeft} days). Renew before expiration to maintain authority.`,
        relatedId: data.id,
        relatedType: 'dsp_document',
        severity: daysLeft <= 30 ? 'critical' : 'warning',
        supabase: admin,
      })
    }
  }

  return NextResponse.json(data, { status: 201 })
}
