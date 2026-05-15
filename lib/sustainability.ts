export const EMISSION_FACTORS = {
  electricity_kwh: 0.000386,
  water_gallon: 0.0000033,
  waste_kg: 0.001,
  local_grain_transport_lb: 0.0000001,
  regional_grain_transport_lb: 0.0000003,
  commodity_grain_transport_lb: 0.0000008,
} as const

export interface SustainabilityLog {
  water_usage_gallons: number | null
  energy_kwh: number | null
  waste_kg: number | null
  grain_source_type: 'local' | 'regional' | 'commodity' | 'unknown' | null
  grain_lbs: number | null
}

export function calculateCO2e(log: SustainabilityLog): number {
  const water = (log.water_usage_gallons || 0) * EMISSION_FACTORS.water_gallon
  const energy = (log.energy_kwh || 0) * EMISSION_FACTORS.electricity_kwh
  const waste = (log.waste_kg || 0) * EMISSION_FACTORS.waste_kg
  let grain = 0
  const lbs = log.grain_lbs || 0
  switch (log.grain_source_type) {
    case 'local':     grain = lbs * EMISSION_FACTORS.local_grain_transport_lb; break
    case 'regional':  grain = lbs * EMISSION_FACTORS.regional_grain_transport_lb; break
    case 'commodity': grain = lbs * EMISSION_FACTORS.commodity_grain_transport_lb; break
    default: grain = lbs * EMISSION_FACTORS.commodity_grain_transport_lb
  }
  return water + energy + waste + grain
}

export function sumLogs(logs: SustainabilityLog[]) {
  let water = 0, energy = 0, waste = 0, grain_local = 0, grain_regional = 0, grain_commodity = 0, grain_unknown = 0, co2 = 0
  for (const l of logs) {
    water += l.water_usage_gallons || 0
    energy += l.energy_kwh || 0
    waste += l.waste_kg || 0
    const lbs = l.grain_lbs || 0
    if (l.grain_source_type === 'local') grain_local += lbs
    else if (l.grain_source_type === 'regional') grain_regional += lbs
    else if (l.grain_source_type === 'commodity') grain_commodity += lbs
    else grain_unknown += lbs
    co2 += calculateCO2e(l)
  }
  const totalGrain = grain_local + grain_regional + grain_commodity + grain_unknown
  return {
    water_gallons: water,
    energy_kwh: energy,
    waste_kg: waste,
    co2e_metric_tons: co2,
    grain: { local: grain_local, regional: grain_regional, commodity: grain_commodity, unknown: grain_unknown, total: totalGrain },
    pct_local: totalGrain > 0 ? grain_local / totalGrain * 100 : 0,
  }
}
