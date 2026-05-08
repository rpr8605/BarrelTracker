import { calculateBarrelAge, getBlendAgeStatement } from '../age-calculator'

describe('calculateBarrelAge', () => {
  it('exactly 2 years ago: under_2_years false, mandatory_age_disclosure true', () => {
    const fill = new Date()
    fill.setFullYear(fill.getFullYear() - 2)
    const age = calculateBarrelAge(fill)
    expect(age.under_2_years).toBe(false)
    expect(age.mandatory_age_disclosure).toBe(true)
  })

  it('4 years + 1 day ago: mandatory_age_disclosure false', () => {
    const fill = new Date()
    fill.setFullYear(fill.getFullYear() - 4)
    fill.setDate(fill.getDate() - 1)
    const age = calculateBarrelAge(fill)
    expect(age.mandatory_age_disclosure).toBe(false)
  })

  it('fill date today: display is "0 mo"', () => {
    const age = calculateBarrelAge(new Date())
    expect(age.display).toBe('0 mo')
    expect(age.days).toBe(0)
  })

  it('display uses yr/mo format for >= 1 year', () => {
    const fill = new Date()
    fill.setFullYear(fill.getFullYear() - 3)
    const age = calculateBarrelAge(fill)
    expect(age.display).toMatch(/\d+ yr \d+ mo/)
  })
})

describe('getBlendAgeStatement', () => {
  it('youngest barrel at 3 yr triggers mandatory disclosure', () => {
    const now = new Date()
    const fill3yr = new Date(now); fill3yr.setFullYear(now.getFullYear() - 3)
    const fill5yr = new Date(now); fill5yr.setFullYear(now.getFullYear() - 5)
    const result = getBlendAgeStatement([
      { fill_date: fill3yr, proof_gallons: 50 },
      { fill_date: fill5yr, proof_gallons: 50 },
    ])
    expect(result.mandatory_disclosure).toBe(true)
    expect(result.label_statement).toContain('Age must appear on label')
  })

  it('throws with empty barrels array', () => {
    expect(() => getBlendAgeStatement([])).toThrow()
  })
})
