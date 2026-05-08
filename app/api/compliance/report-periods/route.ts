import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { validateMonthlyBalances } from '@/lib/ttb/balance-validator'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })
  const admin = createServiceClient()
  const { data, error } = await admin.from('ttb_report_periods').select('*')
    .eq('distillery_id', distilleryId).order('report_month', { ascending: false }).limit(24)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { distillery_id, report_month, form_5110_40_values, form_5110_11_values, form_5110_28_values, status, confirmation_number, notes } = body
  if (!distillery_id || !report_month) return NextResponse.json({ error: 'Missing distillery_id or report_month' }, { status: 400 })
  const admin = createServiceClient()
  const { data, error } = await admin.from('ttb_report_periods').upsert({
    distillery_id, report_month,
    form_5110_40_values: form_5110_40_values ?? null,
    form_5110_11_values: form_5110_11_values ?? null,
    form_5110_28_values: form_5110_28_values ?? null,
    status: status ?? 'draft',
    filed_at: status === 'filed' ? new Date().toISOString() : null,
    confirmation_number: confirmation_number ?? null,
    notes: notes ?? null,
  }, { onConflict: 'distillery_id,report_month' }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  // Mark a specific form as submitted
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id, form, confirmation_number } = await req.json()
  if (!id || !form) return NextResponse.json({ error: 'Missing id or form' }, { status: 400 })

  const validForms = ['5110.40', '5110.11', '5110.28', '5000.24'] as const
  type ValidForm = typeof validForms[number]
  if (!validForms.includes(form as ValidForm)) {
    return NextResponse.json({ error: `Invalid form. Use one of: ${validForms.join(', ')}` }, { status: 400 })
  }

  const admin = createServiceClient()

  // Verify ownership
  const { data: period } = await admin.from('ttb_report_periods').select('distillery_id').eq('id', id).single()
  if (!period) return NextResponse.json({ error: 'Period not found' }, { status: 404 })

  const { data: dist } = await admin.from('distilleries').select('id').eq('id', period.distillery_id).eq('owner_id', user.id).single()
  if (!dist) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  const col = form.replace('.', '_')
  const updates: Record<string, unknown> = {
    [`form_${col}_status`]: 'submitted',
    [`form_${col}_submitted_at`]: new Date().toISOString(),
  }
  if (confirmation_number) {
    updates[`form_${col}_confirmation`] = confirmation_number
  }

  const { data, error } = await admin.from('ttb_report_periods').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { distillery_id, report_month } = await req.json()
  if (!distillery_id || !report_month) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  const admin = createServiceClient()
  const result = await validateMonthlyBalances(distillery_id, new Date(report_month), admin as Parameters<typeof validateMonthlyBalances>[2])
  return NextResponse.json(result)
}
