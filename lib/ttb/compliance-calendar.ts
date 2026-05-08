import { taxPeriodDueDate, monthlyReportDueDate, daysUntil } from './business-days'

export interface ComplianceDeadline {
  id: string
  title: string
  description: string
  due_date: string
  category: 'monthly_report' | 'semi_monthly_fet' | 'quarterly_inventory' | 'semi_annual_inventory' | 'permit_renewal'
  form?: string
  status: 'upcoming' | 'due_soon' | 'overdue' | 'filed'
  days_until: number
}

function iso(d: Date): string {
  return d.toISOString().split('T')[0]
}

export function generateComplianceDeadlines(
  fromDate: Date,
  monthsAhead = 6,
  permitExpirations: Array<{ id: string; title: string; expiration_date: string }> = [],
  filedIds: Set<string> = new Set()
): ComplianceDeadline[] {
  const deadlines: ComplianceDeadline[] = []

  for (let i = 0; i < monthsAhead; i++) {
    const d = new Date(fromDate.getFullYear(), fromDate.getMonth() + i, 1)
    const year = d.getFullYear()
    const month1 = d.getMonth() // 0-indexed — JS month number of this period
    const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const periodKey = iso(d).slice(0, 7) // YYYY-MM

    // Monthly reports due 15th of following month (adjusted for business days)
    const monthlyDue = monthlyReportDueDate(year, month1 + 1) // month1+1 → next month 0-indexed
    const monthlyId = `monthly-${periodKey}`
    deadlines.push({
      id: monthlyId,
      title: `Monthly TTB Reports — ${label}`,
      description: 'Forms 5110.40 (Production), 5110.11 (Storage), 5110.28 (Processing)',
      due_date: iso(monthlyDue),
      category: 'monthly_report',
      form: '5110.40 / 5110.11 / 5110.28',
      status: resolveStatus(monthlyId, monthlyDue, filedIds),
      days_until: daysUntil(monthlyDue),
    })

    // Semi-monthly FET Period 1 (1–15th) due 29th of same month
    const p1Due = taxPeriodDueDate(year, month1 + 1, 1)
    const p1Id = `fet-p1-${periodKey}`
    deadlines.push({
      id: p1Id,
      title: `FET Period 1 (1–15) — ${label}`,
      description: 'Semi-monthly excise tax deposit for the 1st–15th. Form 5000.24.',
      due_date: iso(p1Due),
      category: 'semi_monthly_fet',
      form: '5000.24',
      status: resolveStatus(p1Id, p1Due, filedIds),
      days_until: daysUntil(p1Due),
    })

    // Semi-monthly FET Period 2 (16th–end) due 14th of following month
    const p2Due = taxPeriodDueDate(year, month1 + 1, 2)
    const p2Id = `fet-p2-${periodKey}`
    deadlines.push({
      id: p2Id,
      title: `FET Period 2 (16–end) — ${label}`,
      description: 'Semi-monthly excise tax deposit for the 16th–end of month. Form 5000.24.',
      due_date: iso(p2Due),
      category: 'semi_monthly_fet',
      form: '5000.24',
      status: resolveStatus(p2Id, p2Due, filedIds),
      days_until: daysUntil(p2Due),
    })
  }

  // Quarterly storage inventory (end of Q1–Q4 of current + next year)
  const currentYear = fromDate.getFullYear()
  for (const yr of [currentYear, currentYear + 1]) {
    for (const [mo, day] of [[1, 31], [4, 30], [7, 31], [10, 31]] as [number, number][]) {
      const qDate = new Date(yr, mo - 1, day)
      const qId = `quarterly-inv-${iso(qDate)}`
      const qDue = qDate
      deadlines.push({
        id: qId,
        title: `Quarterly Storage Inventory — ${qDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        description: 'Physical inventory of storage account required quarterly per 27 CFR 19.133',
        due_date: iso(qDue),
        category: 'quarterly_inventory',
        status: resolveStatus(qId, qDue, filedIds),
        days_until: daysUntil(qDue),
      })
    }
  }

  // Semi-annual processing inventory (June 30 and Dec 31)
  for (const yr of [currentYear, currentYear + 1]) {
    for (const [mo, day] of [[6, 30], [12, 31]] as [number, number][]) {
      const saDate = new Date(yr, mo - 1, day)
      const saId = `semi-annual-inv-${iso(saDate)}`
      deadlines.push({
        id: saId,
        title: `Semi-Annual Processing Inventory — ${saDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}`,
        description: 'Physical inventory of processing account required semi-annually per 27 CFR 19.623',
        due_date: iso(saDate),
        category: 'semi_annual_inventory',
        status: resolveStatus(saId, saDate, filedIds),
        days_until: daysUntil(saDate),
      })
    }
  }

  // Permit expirations
  for (const permit of permitExpirations) {
    if (!permit.expiration_date) continue
    const expDate = new Date(permit.expiration_date)
    const pId = `permit-${permit.id}`
    deadlines.push({
      id: pId,
      title: `Permit Renewal: ${permit.title}`,
      description: 'DSP document expires — renew before expiration to avoid lapse in authority',
      due_date: permit.expiration_date,
      category: 'permit_renewal',
      status: resolveStatus(pId, expDate, filedIds),
      days_until: daysUntil(expDate),
    })
  }

  return deadlines.sort((a, b) => a.due_date.localeCompare(b.due_date))
}

function resolveStatus(
  id: string,
  dueDate: Date,
  filedIds: Set<string>
): 'upcoming' | 'due_soon' | 'overdue' | 'filed' {
  if (filedIds.has(id)) return 'filed'
  const d = daysUntil(dueDate)
  if (d < 0) return 'overdue'
  if (d <= 7) return 'due_soon'
  return 'upcoming'
}
