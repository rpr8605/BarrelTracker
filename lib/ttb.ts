// ─── Spirit types ─────────────────────────────────────────────────────────────
export const TTB_SPIRITS_TYPES = [
  { value: 'bourbon', label: 'Bourbon Whiskey' },
  { value: 'tennessee_whiskey', label: 'Tennessee Whiskey' },
  { value: 'rye_whiskey', label: 'Rye Whiskey' },
  { value: 'wheat_whiskey', label: 'Wheat Whiskey' },
  { value: 'malt_whiskey', label: 'Malt Whiskey' },
  { value: 'corn_whiskey', label: 'Corn Whiskey' },
  { value: 'neutral_spirits', label: 'Neutral Spirits' },
  { value: 'brandy', label: 'Brandy' },
  { value: 'rum', label: 'Rum' },
  { value: 'gin', label: 'Gin' },
  { value: 'tequila', label: 'Tequila/Mezcal' },
  { value: 'other', label: 'Other' },
] as const
export type SpiritsType = (typeof TTB_SPIRITS_TYPES)[number]['value']

// ─── Cooperage type codes (27 CFR Part 19, Subpart S) ─────────────────────────
export const COOPERAGE_CODES = [
  { value: 'C',   label: 'C — New charred oak',        note: 'Required for Bourbon' },
  { value: 'REC', label: 'REC — Recharred oak',         note: '' },
  { value: 'P',   label: 'P — Plain (uncharred) new oak', note: '' },
  { value: 'PAR', label: 'PAR — Paraffined',            note: '' },
  { value: 'G',   label: 'G — Glued',                   note: '' },
  { value: 'R',   label: 'R — Reused cooperage',        note: 'Required for Corn Whisky if aged' },
  { value: 'PS',  label: 'PS — Steamed/water-soaked',   note: '' },
] as const
export type CooperageCode = (typeof COOPERAGE_CODES)[number]['value']

/** Bourbon must use code C. Returns error string or null. */
export function validateCooperage(spiritsType: string, cooperageCode: string): string | null {
  if (spiritsType === 'bourbon' && cooperageCode !== 'C')
    return 'Bourbon must use new charred oak (cooperage code C)'
  if (spiritsType === 'corn_whiskey' && cooperageCode === 'C')
    return 'Corn Whiskey cannot use new charred oak — use code R or P'
  return null
}

// ─── Gauge types ──────────────────────────────────────────────────────────────
export const GAUGE_TYPE_LABELS: Record<string, string> = {
  production: 'Production gauge',
  fill: 'Barrel fill',
  bottling: 'Bottling',
  regauge: 'Re-gauge',
  post_tib: 'Post-TIB',
  tamper: 'Post-tamper',
}

// ─── Production log types ─────────────────────────────────────────────────────
export const PRODUCTION_LOG_LABELS: Record<string, string> = {
  mash_batch: 'Mash batch',
  fermentation: 'Fermentation',
  distillation: 'Distillation run',
  transfer_to_storage: 'Transfer to storage',
  production_loss: 'Production loss',
}

// ─── Processing log types ─────────────────────────────────────────────────────
export const PROCESSING_LOG_LABELS: Record<string, string> = {
  bottling_run: 'Bottling run',
  remnant: 'Remnant record',
  leaker: 'Leaker record',
  tax_removal: 'Tax-determined removal',
  processing_receipt: 'Receipt from storage',
  processing_loss: 'Processing loss',
}

// ─── Barrel event labels ──────────────────────────────────────────────────────
export const TTB_EVENT_LABELS: Record<string, string> = {
  fill: 'Fill',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
  gain: 'Gain',
  loss: 'Loss',
  bottling: 'Bottling',
  dump: 'Dump',
}

// ─── CBMA Federal Excise Tax rates ────────────────────────────────────────────
export const FET_RATE_REDUCED = 2.70   // per proof gallon, first 100k
export const FET_RATE_STANDARD = 13.50 // per proof gallon, above 100k
export const FET_CBMA_THRESHOLD = 100_000

export function calcFET(proofGallons: number, ytdProofGallons: number): number {
  const remaining = Math.max(0, FET_CBMA_THRESHOLD - ytdProofGallons)
  const atReduced = Math.min(proofGallons, remaining)
  const atStandard = proofGallons - atReduced
  return (atReduced * FET_RATE_REDUCED) + (atStandard * FET_RATE_STANDARD)
}

// ─── Math helpers ─────────────────────────────────────────────────────────────
export function calcProofGallons(wineGallons: number, proof: number): number {
  return Math.round(wineGallons * (proof / 100) * 10000) / 10000
}

export function eventSign(eventType: string): 1 | -1 {
  return ['fill', 'transfer_in', 'gain'].includes(eventType) ? 1 : -1
}

export function formatWineGal(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${n.toFixed(2)} WG`
}

export function formatProofGal(n: number | null | undefined): string {
  if (n == null) return '—'
  return `${n.toFixed(2)} PG`
}

export function spiritsLabel(v: string): string {
  return TTB_SPIRITS_TYPES.find((t) => t.value === v)?.label ?? v
}

// ─── Filing deadline helpers ──────────────────────────────────────────────────
/** Returns YYYY-MM-DD of the 15th of the month following a given period date */
export function monthlyReportDue(periodDate: Date): Date {
  return new Date(periodDate.getFullYear(), periodDate.getMonth() + 1, 15)
}

/** Returns true when we're past the 15th of the following month */
export function isOverdue(periodDateStr: string): boolean {
  return new Date() > monthlyReportDue(new Date(periodDateStr))
}

/** Days until/since the filing deadline for a given period */
export function daysUntilDue(periodDateStr: string): number {
  const due = monthlyReportDue(new Date(periodDateStr))
  return Math.ceil((due.getTime() - Date.now()) / 86_400_000)
}
