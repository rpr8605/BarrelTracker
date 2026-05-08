export const CBMA_THRESHOLD = 100_000
export const FET_REDUCED = 2.70
export const FET_STANDARD = 13.50

export interface CBMAStatus {
  calendar_year: number
  ytd_proof_gallons: number
  cbma_threshold: number
  cbma_remaining: number
  current_rate: 2.70 | 13.50
  pct_used: number
  warning_level: 'none' | 'approaching' | 'near' | 'exceeded'
  ytd_tax_at_270: number
  ytd_tax_at_1350: number
  ytd_total_tax: number
}

export function computeCBMAStatus(ytdProofGallons: number, year: number): CBMAStatus {
  const remaining = Math.max(0, CBMA_THRESHOLD - ytdProofGallons)
  const exceeded = ytdProofGallons > CBMA_THRESHOLD
  const pgAt270 = Math.min(ytdProofGallons, CBMA_THRESHOLD)
  const pgAt1350 = Math.max(0, ytdProofGallons - CBMA_THRESHOLD)
  return {
    calendar_year: year,
    ytd_proof_gallons: ytdProofGallons,
    cbma_threshold: CBMA_THRESHOLD,
    cbma_remaining: remaining,
    current_rate: exceeded ? 13.50 : 2.70,
    pct_used: Math.min(100, (ytdProofGallons / CBMA_THRESHOLD) * 100),
    warning_level: exceeded ? 'exceeded' : ytdProofGallons >= 95_000 ? 'near' : ytdProofGallons >= 80_000 ? 'approaching' : 'none',
    ytd_tax_at_270: pgAt270 * FET_REDUCED,
    ytd_tax_at_1350: pgAt1350 * FET_STANDARD,
    ytd_total_tax: (pgAt270 * FET_REDUCED) + (pgAt1350 * FET_STANDARD),
  }
}

export function getRateForRemoval(ytdBeforeRemoval: number, removalPG: number): { at_270: number; at_1350: number; tax: number; rate: number } {
  const at_270 = Math.max(0, Math.min(removalPG, CBMA_THRESHOLD - ytdBeforeRemoval))
  const at_1350 = Math.max(0, removalPG - at_270)
  const tax = (at_270 * FET_REDUCED) + (at_1350 * FET_STANDARD)
  // Single rate that applies to the whole removal (for simple cases where not straddling threshold)
  const rate = at_1350 > 0 && at_270 > 0 ? (tax / removalPG) : (at_1350 > 0 ? FET_STANDARD : FET_REDUCED)
  return { at_270, at_1350, tax: Math.round(tax * 100) / 100, rate }
}

export function calcWineGallonsFromBottles(cases: number, bottlesPerCase: number, bottleSizeMl: number): number {
  return Math.round((cases * bottlesPerCase * bottleSizeMl / 3785.41) * 10000) / 10000
}

export function calcProofGallonsFromBottles(cases: number, bottlesPerCase: number, bottleSizeMl: number, proof: number): number {
  const wg = calcWineGallonsFromBottles(cases, bottlesPerCase, bottleSizeMl)
  return Math.round(wg * proof / 100 * 10000) / 10000
}
