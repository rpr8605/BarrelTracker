export interface BarrelAge {
  days: number
  years: number
  months: number
  display: string
  mandatory_age_disclosure: boolean
  under_2_years: boolean
  months_total: number
}

export function calculateBarrelAge(
  fillDate: Date | string,
  toDate: Date | string = new Date()
): BarrelAge {
  const fill = new Date(fillDate)
  const to = new Date(toDate)
  const diffMs = to.getTime() - fill.getTime()
  const days = Math.max(0, Math.floor(diffMs / 86400000))
  const years = Math.floor(days / 365.25)
  const remainingDays = days - Math.floor(years * 365.25)
  const months = Math.floor(remainingDays / 30.4375)
  const months_total = Math.floor(days / 30.4375)

  return {
    days,
    years,
    months,
    months_total,
    display: years >= 1 ? `${years} yr ${months} mo` : `${months_total} mo`,
    mandatory_age_disclosure: days > 0 && months_total < 48,
    under_2_years: months_total < 24,
  }
}

export function getBlendAgeStatement(
  barrels: Array<{ fill_date: Date | string; proof_gallons: number }>
): { youngest_age: BarrelAge; mandatory_disclosure: boolean; label_statement: string } {
  if (barrels.length === 0) throw new Error('No barrels provided')

  const sorted = [...barrels].sort(
    (a, b) => new Date(b.fill_date).getTime() - new Date(a.fill_date).getTime()
  )
  const youngest_age = calculateBarrelAge(sorted[0].fill_date)

  return {
    youngest_age,
    mandatory_disclosure: youngest_age.mandatory_age_disclosure,
    label_statement: youngest_age.mandatory_age_disclosure
      ? `Age must appear on label: minimum ${youngest_age.display} (youngest component per 27 CFR 5.74(b))`
      : 'Age statement optional',
  }
}
