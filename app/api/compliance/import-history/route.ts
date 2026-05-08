import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })

  const admin = createServiceClient()
  const { data, error } = await admin
    .from('ttb_report_periods')
    .select('*')
    .eq('distillery_id', distilleryId)
    .order('report_month', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ records: data, count: data?.length ?? 0 })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { distillery_id, records } = body as {
    distillery_id: string
    records: Array<{
      report_month: string
      form_type: '5110.40' | '5110.11' | '5110.28'
      line_items: Record<string, unknown>
      confirmation_number?: string
      filed_date?: string
    }>
  }

  if (!distillery_id || !Array.isArray(records) || records.length === 0) {
    return NextResponse.json({ error: 'Missing distillery_id or records' }, { status: 400 })
  }

  const admin = createServiceClient()
  const { data: dist } = await admin.from('distilleries').select('owner_id').eq('id', distillery_id).single()
  if (!dist || dist.owner_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const upserts = records.map((r) => {
    const formCol = `form_${r.form_type.replace('.', '_')}_values`
    return {
      distillery_id,
      report_month: r.report_month,
      [formCol]: r.line_items,
      status: 'filed' as const,
      filed_at: r.filed_date ? new Date(r.filed_date).toISOString() : new Date().toISOString(),
      confirmation_number: r.confirmation_number ?? null,
      import_source: 'historical_import',
    }
  })

  const results = []
  for (const upsert of upserts) {
    const { data, error } = await admin
      .from('ttb_report_periods')
      .upsert(upsert, { onConflict: 'distillery_id,report_month', ignoreDuplicates: false })
      .select().single()
    if (error) results.push({ error: error.message, report_month: upsert.report_month })
    else results.push({ ok: true, id: (data as Record<string, unknown>)?.id, report_month: upsert.report_month })
  }

  const errors = results.filter((r) => 'error' in r)
  return NextResponse.json({ results, success_count: results.length - errors.length, error_count: errors.length })
}
