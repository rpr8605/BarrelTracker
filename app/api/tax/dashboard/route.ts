import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { computeCBMAStatus } from '@/lib/ttb/cbma-calculator'
import { buildTaxPeriod } from '@/lib/ttb/tax-periods'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })

  const now = new Date()
  const year = now.getFullYear()
  const admin = createServiceClient()

  const [ytdRes, monthRes] = await Promise.all([
    admin.from('tax_determined_removals').select('proof_gallons, tax_owed, removal_date, tax_period, cbma_rate_applied')
      .eq('distillery_id', distilleryId)
      .gte('removal_date', `${year}-01-01`),
    admin.from('tax_determined_removals').select('proof_gallons, tax_owed, removal_date, tax_period, product_name, cases_removed, destination')
      .eq('distillery_id', distilleryId)
      .gte('removal_date', `${year}-${String(now.getMonth() + 1).padStart(2, '0')}-01`),
  ])

  const ytd = ytdRes.data ?? []
  const monthRemovals = monthRes.data ?? []

  const ytdPG = ytd.reduce((s, r) => s + (r.proof_gallons ?? 0), 0)
  const ytdTax = ytd.reduce((s, r) => s + (r.tax_owed ?? 0), 0)
  const cbma = computeCBMAStatus(ytdPG, year)

  // Group by month for bar chart (last 12 months)
  const byMonth: Record<string, { proof_gallons: number; tax_owed: number }> = {}
  for (const r of ytd) {
    const m = r.removal_date.slice(0, 7) // YYYY-MM
    if (!byMonth[m]) byMonth[m] = { proof_gallons: 0, tax_owed: 0 }
    byMonth[m].proof_gallons += r.proof_gallons ?? 0
    byMonth[m].tax_owed += r.tax_owed ?? 0
  }

  // Group current month by semi-monthly period
  const byPeriod: Record<string, { proof_gallons: number; tax_owed: number; removals: typeof monthRemovals }> = {}
  for (const r of monthRemovals) {
    const k = r.tax_period
    if (!byPeriod[k]) byPeriod[k] = { proof_gallons: 0, tax_owed: 0, removals: [] }
    byPeriod[k].proof_gallons += r.proof_gallons ?? 0
    byPeriod[k].tax_owed += r.tax_owed ?? 0
    byPeriod[k].removals.push(r)
  }

  // Current and prior semi-monthly periods
  const m = now.getMonth() + 1
  const d = now.getDate()
  const currentPeriod = buildTaxPeriod(year, m, d <= 15 ? 1 : 2)
  const priorPeriod = d <= 15
    ? buildTaxPeriod(year, m === 1 ? 12 : m - 1, 2)
    : buildTaxPeriod(year, m, 1)

  return NextResponse.json({
    cbma_status: cbma,
    ytd_proof_gallons: ytdPG,
    ytd_total_tax: Math.round(ytdTax * 100) / 100,
    monthly_breakdown: Object.entries(byMonth).map(([month, v]) => ({ month, ...v })).sort((a, b) => a.month.localeCompare(b.month)),
    current_period: { ...currentPeriod, ...byPeriod[currentPeriod.period_key] ?? { proof_gallons: 0, tax_owed: 0, removals: [] } },
    prior_period: { ...priorPeriod, ...byPeriod[priorPeriod.period_key] ?? { proof_gallons: 0, tax_owed: 0, removals: [] } },
  })
}
