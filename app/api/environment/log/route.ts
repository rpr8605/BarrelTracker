import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServiceClient()
  const { zone, temperature_f, humidity_pct, distillery_id } = await req.json()

  const { data, error } = await supabase.from('environmental_logs').insert({
    distillery_id,
    warehouse_zone: zone,
    temperature_f,
    humidity_pct,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Check thresholds
  if (temperature_f > 90 || temperature_f < 40 || humidity_pct > 75 || humidity_pct < 40) {
    // In production: send email via Supabase Edge Function
    console.warn(`Environmental alert: zone=${zone}, temp=${temperature_f}°F, humidity=${humidity_pct}%`)
  }

  return NextResponse.json(data)
}
