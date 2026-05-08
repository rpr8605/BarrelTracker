import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { generateComplianceDeadlines } from '@/lib/ttb/compliance-calendar'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })

  const admin = createServiceClient()

  // Fetch expiring permits
  const { data: permits } = await admin
    .from('dsp_documents')
    .select('id,title,expiration_date')
    .eq('distillery_id', distilleryId)
    .eq('status', 'active')
    .not('expiration_date', 'is', null)

  // Fetch filed period IDs to mark filed deadlines
  const { data: filedPeriods } = await admin
    .from('ttb_report_periods')
    .select('report_month,form_5110_40_status,form_5110_11_status,form_5110_28_status,form_5000_24_status')
    .eq('distillery_id', distilleryId)
    .eq('status', 'filed')

  const filedIds = new Set<string>()
  for (const p of filedPeriods ?? []) {
    const ym = (p.report_month as string).slice(0, 7)
    if (p.form_5110_40_status === 'submitted' || p.form_5110_11_status === 'submitted' || p.form_5110_28_status === 'submitted') {
      filedIds.add(`monthly-${ym}`)
    }
    if (p.form_5000_24_status === 'submitted') {
      filedIds.add(`fet-p1-${ym}`)
      filedIds.add(`fet-p2-${ym}`)
    }
  }

  const deadlines = generateComplianceDeadlines(
    new Date(),
    6,
    (permits ?? []).map((p) => ({ id: p.id as string, title: p.title as string, expiration_date: p.expiration_date as string })),
    filedIds
  )

  return NextResponse.json(deadlines)
}
