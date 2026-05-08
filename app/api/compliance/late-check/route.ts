import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

// Returns count of records entered after the next-business-day deadline in the last 7 days
export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })

  const admin = createServiceClient()
  const since = new Date(Date.now() - 7 * 86_400_000).toISOString()

  const [gaugeRes, prodRes, procRes] = await Promise.all([
    admin.from('gauge_records').select('id', { count: 'exact' })
      .eq('distillery_id', distilleryId).eq('is_late_entry', true).gte('created_at', since),
    admin.from('production_logs').select('id', { count: 'exact' })
      .eq('distillery_id', distilleryId).eq('is_late_entry', true).gte('created_at', since),
    admin.from('processing_logs').select('id', { count: 'exact' })
      .eq('distillery_id', distilleryId).eq('is_late_entry', true).gte('created_at', since),
  ])

  const late_count = (gaugeRes.count ?? 0) + (prodRes.count ?? 0) + (procRes.count ?? 0)
  return NextResponse.json({ late_count })
}
