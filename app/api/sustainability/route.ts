import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { sumLogs } from '@/lib/sustainability'

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) return NextResponse.json({ error: 'no_distillery' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const year = parseInt(searchParams.get('year') || String(new Date().getFullYear()))
  const start = `${year}-01-01`
  const end = `${year + 1}-01-01`

  const db = createServiceClient()
  const { data: logs } = await db
    .from('production_sustainability_log')
    .select('*')
    .eq('distillery_id', distilleryId)
    .gte('log_date', start)
    .lt('log_date', end)
    .order('log_date', { ascending: true })

  const monthly: Record<string, { water: number; energy: number }> = {}
  for (const l of (logs || []) as Array<{ log_date: string; water_usage_gallons: number | null; energy_kwh: number | null }>) {
    const m = l.log_date.slice(0, 7)
    if (!monthly[m]) monthly[m] = { water: 0, energy: 0 }
    monthly[m].water += l.water_usage_gallons || 0
    monthly[m].energy += l.energy_kwh || 0
  }
  const summary = sumLogs((logs || []) as never)
  return NextResponse.json({ summary, monthly, logs: logs || [] })
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) return NextResponse.json({ error: 'no_distillery' }, { status: 400 })

  const body = await req.json()
  const db = createServiceClient()
  const { data, error } = await db.from('production_sustainability_log').insert({
    distillery_id: distilleryId,
    log_date: body.log_date,
    water_usage_gallons: body.water_usage_gallons ?? null,
    energy_kwh: body.energy_kwh ?? null,
    waste_kg: body.waste_kg ?? null,
    grain_source_type: body.grain_source_type || null,
    grain_lbs: body.grain_lbs ?? null,
    notes: body.notes || null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ log: data })
}
