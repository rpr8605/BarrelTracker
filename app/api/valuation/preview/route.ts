import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { valueBarrels, type ValuationRate, type ValuationBarrel } from '@/lib/valuation'

// Map our internal spirits_type enum to user-facing labels in the rate table
const SPIRIT_LABEL: Record<string, string> = {
  bourbon: 'Bourbon',
  tennessee_whiskey: 'Bourbon',
  rye_whiskey: 'Rye',
  wheat_whiskey: 'Malt Whiskey',
  malt_whiskey: 'Malt Whiskey',
  corn_whiskey: 'Bourbon',
  rum: 'Rum',
  neutral_spirits: 'Other',
  brandy: 'Other',
  gin: 'Other',
  tequila: 'Other',
  other: 'Other',
}

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) return NextResponse.json({ error: 'no_distillery' }, { status: 400 })

  const db = createServiceClient()
  const [{ data: ratesData }, { data: barrelsData }] = await Promise.all([
    db.from('valuation_rates').select('*'),
    db.from('barrels').select('id, barrel_number, spirits_type, mash_bill, entry_date, current_wine_gallons, status').eq('distillery_id', distilleryId).neq('status', 'dumped').neq('status', 'bottled'),
  ])

  const rates = (ratesData || []) as ValuationRate[]
  const barrels: ValuationBarrel[] = (barrelsData || []).map((b: { id: string; barrel_number: string; spirits_type: string | null; mash_bill: string | null; entry_date: string | null; current_wine_gallons: number | null }) => ({
    id: b.id,
    barrel_number: b.barrel_number,
    spirit_type: SPIRIT_LABEL[b.spirits_type || ''] || 'Other',
    fill_date: b.entry_date,
    current_volume_gallons: b.current_wine_gallons,
  }))

  const result = valueBarrels(barrels, rates)
  return NextResponse.json(result)
}
