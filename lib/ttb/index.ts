// lib/ttb/index.ts
// Re-exports all public functions from lib/ttb/* so callers can import from '@/lib/ttb/index'
// or '@/lib/ttb'.
//
// NOTE: lib/ttb.ts (at the lib/ level) exports an overlapping set of constants and functions.
// The two files are NOT identical — see conflict notes below.
// Prefer importing from '@/lib/ttb' (lib/ttb.ts) for constants/labels/calc helpers,
// and from '@/lib/ttb/business-days', '@/lib/ttb/balance-validator', '@/lib/ttb/inventory-pdf'
// for the functions defined there.
//
// CONFLICT: monthlyReportDue (lib/ttb.ts) vs monthlyReportDueDate (lib/ttb/business-days.ts)
//   - lib/ttb.ts monthlyReportDue: always returns 15th of following month, no business-day adjustment
//   - lib/ttb/business-days.ts monthlyReportDueDate: adjusts to prior business day — USE THIS ONE
//   - This index does NOT re-export monthlyReportDue from lib/ttb.ts to avoid confusion.
//   - Always use monthlyReportDueDate from this index.

export {
  getNextBusinessDay,
  getPriorBusinessDay,
  nextBusinessDayDeadline,
  isRecordLate,
  taxPeriodDueDate,
  monthlyReportDueDate,
  daysUntil,
} from './business-days'

export type { BalanceCheck, BalanceValidationResult } from './balance-validator'
export { validateMonthlyBalances } from './balance-validator'

export type { InventoryItem, AttestationPDFData } from './inventory-pdf'
export { generateAttestationPDF } from './inventory-pdf'

export { validateStandardOfIdentity } from './standards-of-identity'
export type { ValidationResult } from './standards-of-identity'

export { calculateBarrelAge, getBlendAgeStatement } from './age-calculator'
export type { BarrelAge } from './age-calculator'
