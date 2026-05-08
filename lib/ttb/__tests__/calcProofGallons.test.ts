import { calcProofGallons } from '../../ttb'

describe('calcProofGallons', () => {
  it('100 wine gallons at 125 proof = 125.0000 PG', () => {
    expect(calcProofGallons(100, 125)).toBe(125.0)
  })

  it('53.7 wine gallons at 80 proof = 42.9600 PG', () => {
    expect(calcProofGallons(53.7, 80)).toBe(42.96)
  })

  it('0.5 wine gallons at 160 proof = 0.8000 PG', () => {
    expect(calcProofGallons(0.5, 160)).toBe(0.8)
  })

  it('1 wine gallon at 190 proof = 1.9000 PG', () => {
    expect(calcProofGallons(1, 190)).toBe(1.9)
  })

  it('rounds to exactly 4 decimal places', () => {
    const result = calcProofGallons(53.7, 80)
    const str = result.toString()
    const decimals = str.includes('.') ? str.split('.')[1].length : 0
    expect(decimals).toBeLessThanOrEqual(4)
  })
})
