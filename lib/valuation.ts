export interface ValuationRate {
  spirit_type: string
  age_min_months: number
  age_max_months: number | null
  rate_per_gallon: number
}

export interface ValuationBarrel {
  id: string
  barrel_number: string
  spirit_type: string | null
  fill_date: string | null
  current_volume_gallons: number | null
}

export interface ValuationLine {
  barrel_id: string
  barrel_number: string
  spirit_type: string
  fill_date: string | null
  age_months: number
  gallons: number
  rate_per_gallon: number
  estimated_value: number
}

export function monthsBetween(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth())
}

export function findRate(rates: ValuationRate[], spiritType: string, ageMonths: number): number {
  const candidates = rates.filter((r) =>
    r.spirit_type.toLowerCase() === spiritType.toLowerCase() &&
    r.age_min_months <= ageMonths &&
    (r.age_max_months == null || ageMonths < r.age_max_months)
  )
  if (candidates.length > 0) return candidates[0].rate_per_gallon
  const fallback = rates.filter((r) => r.spirit_type === 'Other' && r.age_min_months <= ageMonths && (r.age_max_months == null || ageMonths < r.age_max_months))
  return fallback[0]?.rate_per_gallon ?? 6.0
}

export function valueBarrels(barrels: ValuationBarrel[], rates: ValuationRate[]): {
  lines: ValuationLine[]
  total_value: number
  total_gallons: number
  barrel_count: number
  avg_age: number
} {
  const today = new Date()
  const lines: ValuationLine[] = []
  let totalValue = 0
  let totalGallons = 0
  let totalAge = 0
  for (const b of barrels) {
    const fillDate = b.fill_date ? new Date(b.fill_date) : null
    const ageMonths = fillDate ? monthsBetween(fillDate, today) : 0
    const gallons = b.current_volume_gallons ?? 0
    const spirit = b.spirit_type || 'Other'
    const rate = findRate(rates, spirit, ageMonths)
    const value = gallons * rate
    lines.push({
      barrel_id: b.id,
      barrel_number: b.barrel_number,
      spirit_type: spirit,
      fill_date: b.fill_date,
      age_months: ageMonths,
      gallons,
      rate_per_gallon: rate,
      estimated_value: value,
    })
    totalValue += value
    totalGallons += gallons
    totalAge += ageMonths
  }
  return {
    lines,
    total_value: totalValue,
    total_gallons: totalGallons,
    barrel_count: barrels.length,
    avg_age: barrels.length ? totalAge / barrels.length : 0,
  }
}
