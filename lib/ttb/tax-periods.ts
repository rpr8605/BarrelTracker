import { getPriorBusinessDay, monthlyReportDueDate } from './business-days'

export interface TaxPeriod {
  year: number
  month: number
  period: 1 | 2
  label: string             // 'January 2025 — Period 1'
  period_key: string        // '2025-01-1'
  start_date: string        // '2025-01-01'
  end_date: string          // '2025-01-15'
  due_date: Date
  due_date_str: string      // 'January 29, 2025'
  payment_deadline: Date    // 1 business day before due (electronic payment cutoff)
}

function pad(n: number) { return String(n).padStart(2, '0') }

// Period 1: 1st–15th, due 29th of same month (or prior business day)
// Period 2: 16th–end, due 14th of following month (or prior business day)
export function getTaxPeriodDueDate(year: number, month: number, period: 1 | 2): Date {
  if (period === 1) {
    const d = new Date(year, month - 1, 29)
    return d.getDay() === 0 || d.getDay() === 6 ? getPriorBusinessDay(d) : d
  } else {
    const d = new Date(year, month, 14) // month is 0-indexed so month = next month
    return d.getDay() === 0 || d.getDay() === 6 ? getPriorBusinessDay(d) : d
  }
}

export function taxPeriodKey(year: number, month: number, period: 1 | 2): string {
  return `${year}-${pad(month)}-${period}`
}

export function removalDateToPeriodKey(date: Date): string {
  const y = date.getFullYear()
  const m = date.getMonth() + 1
  const d = date.getDate()
  return taxPeriodKey(y, m, d <= 15 ? 1 : 2)
}

export function buildTaxPeriod(year: number, month: number, period: 1 | 2): TaxPeriod {
  const monthName = new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  const due = getTaxPeriodDueDate(year, month, period)
  const payDeadline = getPriorBusinessDay(due)
  const startDay = period === 1 ? 1 : 16
  const endDay = period === 1 ? 15 : new Date(year, month, 0).getDate()
  return {
    year, month, period,
    label: `${monthName} — Period ${period}`,
    period_key: taxPeriodKey(year, month, period),
    start_date: `${year}-${pad(month)}-${pad(startDay)}`,
    end_date: `${year}-${pad(month)}-${pad(endDay)}`,
    due_date: due,
    due_date_str: due.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    payment_deadline: payDeadline,
  }
}

export function getYearTaxPeriods(year: number): TaxPeriod[] {
  const periods: TaxPeriod[] = []
  for (let m = 1; m <= 12; m++) {
    periods.push(buildTaxPeriod(year, m, 1))
    periods.push(buildTaxPeriod(year, m, 2))
  }
  return periods
}
