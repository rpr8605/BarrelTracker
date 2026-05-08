import { validateStandardOfIdentity } from '../standards-of-identity'

describe('validateStandardOfIdentity', () => {
  it('valid bourbon: C cooperage, 125 proof, 60% corn', () => {
    const r = validateStandardOfIdentity({
      spirit_class: 'bourbon',
      cooperage_code: 'C',
      entry_proof: 125,
      grain_bill: { corn: 60, rye: 25, malted_barley: 15 },
    })
    expect(r.valid).toBe(true)
    expect(r.errors).toHaveLength(0)
  })

  it('invalid bourbon: R cooperage returns CFR citation', () => {
    const r = validateStandardOfIdentity({ spirit_class: 'bourbon', cooperage_code: 'R' })
    expect(r.valid).toBe(false)
    expect(r.errors[0]).toContain('27 CFR')
    expect(r.errors[0]).toContain('new charred oak')
  })

  it('invalid bourbon: 126 proof entry', () => {
    const r = validateStandardOfIdentity({ spirit_class: 'bourbon', cooperage_code: 'C', entry_proof: 126 })
    expect(r.valid).toBe(false)
    expect(r.errors.some((e) => e.includes('125 proof'))).toBe(true)
  })

  it('invalid bourbon: 49% corn', () => {
    const r = validateStandardOfIdentity({
      spirit_class: 'bourbon',
      cooperage_code: 'C',
      entry_proof: 110,
      grain_bill: { corn: 49, rye: 36, malted_barley: 15 },
    })
    expect(r.valid).toBe(false)
    expect(r.errors.some((e) => e.includes('51% corn'))).toBe(true)
  })

  it('corn whisky with C cooperage returns error', () => {
    const r = validateStandardOfIdentity({ spirit_class: 'corn_whisky', cooperage_code: 'C' })
    expect(r.valid).toBe(false)
    expect(r.errors[0]).toContain('NOT use new charred oak')
  })

  it('corn whiskey (alias) with R cooperage is valid', () => {
    const r = validateStandardOfIdentity({ spirit_class: 'corn_whiskey', cooperage_code: 'R' })
    expect(r.valid).toBe(true)
  })

  it('unknown spirit class returns valid', () => {
    const r = validateStandardOfIdentity({ spirit_class: 'mystery_spirit', cooperage_code: 'C' })
    expect(r.valid).toBe(true)
    expect(r.errors).toHaveLength(0)
  })

  it('vodka with is_aged=true returns error', () => {
    const r = validateStandardOfIdentity({ spirit_class: 'vodka', is_aged: true })
    expect(r.valid).toBe(false)
    expect(r.errors.some((e) => e.includes('cannot be labeled as aged'))).toBe(true)
  })
})
