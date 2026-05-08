const FEDERAL_HOLIDAYS = new Set([
  '2025-01-01','2025-01-20','2025-02-17','2025-05-26','2025-06-19','2025-07-04',
  '2025-09-01','2025-10-13','2025-11-11','2025-11-27','2025-12-25',
  '2026-01-01','2026-01-19','2026-02-16','2026-05-25','2026-06-19','2026-07-04',
  '2026-09-07','2026-10-12','2026-11-11','2026-11-26','2026-12-25',
  '2027-01-01','2027-01-18','2027-02-15','2027-05-31','2027-06-19','2027-07-05',
  '2027-09-06','2027-10-11','2027-11-11','2027-11-25','2027-12-24',
])

function isoDate(d: Date) {
  return d.toISOString().split('T')[0]
}

function isBusinessDay(d: Date): boolean {
  const dow = d.getDay()
  return dow !== 0 && dow !== 6 && !FEDERAL_HOLIDAYS.has(isoDate(d))
}

export function getNextBusinessDay(date: Date): Date {
  const d = new Date(date)
  do { d.setDate(d.getDate() + 1) } while (!isBusinessDay(d))
  return d
}

export function getPriorBusinessDay(date: Date): Date {
  const d = new Date(date)
  do { d.setDate(d.getDate() - 1) } while (!isBusinessDay(d))
  return d
}

// 27 CFR 19.580: records entered no later than close of next business day after operation
export function nextBusinessDayDeadline(transactionDate: Date): Date {
  const d = getNextBusinessDay(transactionDate)
  d.setHours(23, 59, 59, 999)
  return d
}

export function isRecordLate(transactionDate: Date, entryTimestamp: Date): boolean {
  return entryTimestamp > nextBusinessDayDeadline(transactionDate)
}

// Semi-monthly FET period due dates (27 CFR 19.237)
export function taxPeriodDueDate(year: number, month: number, period: 1 | 2): Date {
  if (period === 1) {
    // Period 1 (1st–15th): due 29th of same month or prior business day
    const d = new Date(year, month - 1, 29)
    return isBusinessDay(d) ? d : getPriorBusinessDay(d)
  } else {
    // Period 2 (16th–end): due 14th of following month or prior business day
    const d = new Date(year, month, 14) // month is 0-indexed so this is month+1
    return isBusinessDay(d) ? d : getPriorBusinessDay(d)
  }
}

// Monthly operational report due: 15th of following month or prior business day
export function monthlyReportDueDate(year: number, month: number): Date {
  const d = new Date(year, month, 15) // month+1, day 15
  return isBusinessDay(d) ? d : getPriorBusinessDay(d)
}

export function daysUntil(target: Date): number {
  return Math.ceil((target.getTime() - Date.now()) / 86_400_000)
}
