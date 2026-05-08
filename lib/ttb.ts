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

export const TTB_EVENT_LABELS: Record<string, string> = {
  fill: 'Fill',
  transfer_in: 'Transfer In',
  transfer_out: 'Transfer Out',
  gain: 'Gain',
  loss: 'Loss',
  bottling: 'Bottling',
  dump: 'Dump',
}

/** Wine gallons × (proof / 100) = proof gallons */
export function calcProofGallons(wineGallons: number, proof: number): number {
  return wineGallons * (proof / 100)
}

/** Volume-change sign: positive events add inventory, negative events remove it */
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
