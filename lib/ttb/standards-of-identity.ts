// Standards of identity rules per 27 CFR Part 5

export const IDENTITY_RULES = {
  bourbon: {
    required_cooperage: 'C',
    max_entry_proof: 125,
    max_distillation_proof: 160,
    min_bottle_proof: 80,
    min_grain_pct: { corn: 51 },
    must_produce_in_usa: true,
    errors: {
      cooperage: 'Bourbon must be aged in new charred oak containers (27 CFR 5.143(b)(1)). Use cooperage code C.',
      entry_proof: 'Bourbon must enter the barrel at 125 proof or less (27 CFR 5.143(b)(1)).',
      grain: 'Bourbon mashbill must be at least 51% corn (27 CFR 5.143(b)(1)).',
    },
  },
  straight_bourbon: {
    required_cooperage: 'C',
    max_entry_proof: 125,
    min_age_months: 24,
    no_additives: true,
    mandatory_age_if_under_months: 48,
    errors: {
      cooperage: 'Straight Bourbon must be aged in new charred oak containers (27 CFR 5.143(b)(1)).',
      entry_proof: 'Straight Bourbon must enter the barrel at 125 proof or less (27 CFR 5.143(b)(1)).',
      age: 'Straight Bourbon must be aged at least 2 years (27 CFR 5.143(b)(1)(i)).',
    },
  },
  tennessee_whisky: {
    required_cooperage: 'C',
    max_entry_proof: 125,
    min_grain_pct: { corn: 51 },
    requires_maple_filtration: true,
    must_produce_in_state: 'TN',
    errors: {
      cooperage: 'Tennessee Whisky requires new charred oak (27 CFR 5.143(b)(1)).',
      entry_proof: 'Tennessee Whisky must enter barrel at 125 proof or less.',
    },
  },
  rye_whisky: {
    required_cooperage: 'C',
    max_entry_proof: 125,
    min_grain_pct: { rye: 51 },
    errors: {
      cooperage: 'Rye Whisky must be aged in new charred oak containers (27 CFR 5.143(b)(2)).',
      entry_proof: 'Rye Whisky must enter the barrel at 125 proof or less (27 CFR 5.143(b)(2)).',
      grain: 'Rye Whisky mashbill must be at least 51% rye (27 CFR 5.143(b)(2)).',
    },
  },
  wheat_whisky: {
    required_cooperage: 'C',
    max_entry_proof: 125,
    min_grain_pct: { wheat: 51 },
    errors: {
      cooperage: 'Wheat Whisky must be aged in new charred oak containers (27 CFR 5.143(b)(3)).',
      grain: 'Wheat Whisky mashbill must be at least 51% wheat (27 CFR 5.143(b)(3)).',
    },
  },
  malt_whisky: {
    required_cooperage: 'C',
    max_entry_proof: 125,
    min_grain_pct: { malted_barley: 51 },
    errors: {
      cooperage: 'Malt Whisky must be aged in new charred oak containers (27 CFR 5.143(b)(4)).',
      grain: 'Malt Whisky mashbill must be at least 51% malted barley (27 CFR 5.143(b)(4)).',
    },
  },
  corn_whisky: {
    blocked_cooperage: ['C'],
    max_distillation_proof: 160,
    min_grain_pct: { corn: 80 },
    errors: {
      cooperage: 'Corn Whisky must NOT use new charred oak if aged. Use R (reused) or P (plain/uncharred) (27 CFR 5.143(b)(5)).',
      grain: 'Corn Whisky mashbill must be at least 80% corn (27 CFR 5.143(b)(5)).',
    },
  },
  vodka: {
    min_distillation_proof: 190,
    cannot_be_aged: true,
    errors: {
      proof: 'Vodka must be distilled at or above 190 proof (27 CFR 5.143(c)(1)).',
      aged: 'Vodka cannot be labeled as aged (27 CFR 5.143(c)(1)).',
    },
  },
} as const

// Normalize: lowercase + spaces to underscores + handle common aliases
function normalizeClass(sc: string): string {
  return sc.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_')
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateStandardOfIdentity(params: {
  spirit_class: string
  cooperage_code?: string
  entry_proof?: number
  distillation_proof?: number
  grain_bill?: Record<string, number>
  is_aged?: boolean
}): ValidationResult {
  const { spirit_class, cooperage_code, entry_proof, distillation_proof, grain_bill, is_aged } = params
  const cls = normalizeClass(spirit_class ?? '')
  // Alias mappings
  const aliased = cls === 'tennessee_whiskey' ? 'tennessee_whisky'
    : cls === 'rye_whiskey' ? 'rye_whisky'
    : cls === 'wheat_whiskey' ? 'wheat_whisky'
    : cls === 'malt_whiskey' ? 'malt_whisky'
    : cls === 'corn_whiskey' ? 'corn_whisky'
    : cls

  const rule = IDENTITY_RULES[aliased as keyof typeof IDENTITY_RULES]
  if (!rule) return { valid: true, errors: [] }

  const errors: string[] = []
  const r = rule as Record<string, unknown>

  // Required cooperage
  if (r.required_cooperage && cooperage_code && cooperage_code !== r.required_cooperage) {
    errors.push((rule.errors as Record<string, string>).cooperage)
  }

  // Blocked cooperage (corn whisky)
  if (r.blocked_cooperage && cooperage_code && (r.blocked_cooperage as string[]).includes(cooperage_code)) {
    errors.push((rule.errors as Record<string, string>).cooperage)
  }

  // Entry proof
  if (r.max_entry_proof != null && entry_proof != null && entry_proof > (r.max_entry_proof as number)) {
    errors.push((rule.errors as Record<string, string>).entry_proof)
  }

  // Distillation proof check (vodka min)
  if (r.min_distillation_proof != null && distillation_proof != null && distillation_proof < (r.min_distillation_proof as number)) {
    errors.push((rule.errors as Record<string, string>).proof)
  }

  // Aging (vodka cannot be aged)
  if (r.cannot_be_aged && is_aged) {
    errors.push((rule.errors as Record<string, string>).aged)
  }

  // Grain bill check
  if (r.min_grain_pct && grain_bill) {
    const minGrains = r.min_grain_pct as Record<string, number>
    const total = Object.values(grain_bill).reduce((s, v) => s + v, 0)
    for (const [grain, minPct] of Object.entries(minGrains)) {
      const pct = total > 0 ? ((grain_bill[grain] ?? 0) / total) * 100 : 0
      if (pct < minPct) {
        errors.push((rule.errors as Record<string, string>).grain)
        break
      }
    }
  }

  return { valid: errors.length === 0, errors }
}
