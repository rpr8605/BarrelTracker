import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const count = searchParams.get('count') === 'true'
  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) return NextResponse.json({ error: 'no_distillery' }, { status: 400 })

  const db = createServiceClient()
  if (count) {
    const { count: c } = await db.from('alert_deliveries').select('*', { count: 'exact', head: true }).eq('distillery_id', distilleryId).is('read_at', null).is('dismissed_at', null)
    return NextResponse.json({ unread: c || 0 })
  }

  const { data } = await db
    .from('alert_deliveries')
    .select('id, delivered_at, read_at, dismissed_at, regulatory_alerts(id, title, summary, action_required, effective_date, source_url, affects_types, published_at)')
    .eq('distillery_id', distilleryId)
    .order('delivered_at', { ascending: false })
    .limit(50)
  return NextResponse.json({ deliveries: data || [] })
}
