import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateComplianceReport } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { distillery_id, month } = await req.json()

  const monthStart = new Date(month)
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0)

  const [barrelsRes, batchesRes] = await Promise.all([
    supabase.from('barrels').select('*').eq('distillery_id', distillery_id),
    supabase.from('batches').select('*').eq('distillery_id', distillery_id)
      .gte('created_at', monthStart.toISOString())
      .lte('created_at', monthEnd.toISOString()),
  ])

  const reportData = {
    period: month,
    barrels: barrelsRes.data || [],
    batches: batchesRes.data || [],
    total_barrels: (barrelsRes.data || []).length,
    bottled_this_month: (batchesRes.data || []).length,
  }

  let generatedData = {}
  try {
    generatedData = await generateComplianceReport(distillery_id, reportData)
  } catch { /* AI not configured */ }

  const { data: report, error } = await supabase.from('ttb_reports').upsert({
    distillery_id,
    report_month: month,
    report_data: generatedData,
    status: 'draft',
    generated_at: new Date().toISOString(),
  }, { onConflict: 'distillery_id,report_month' }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(report)
}
