'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  OnboardingShell,
  FormCard,
  FieldGrid,
  TextField,
  SelectField,
  CheckboxGroup,
  Toggle,
  NavRow,
} from '../OnboardingShell'
import {
  COOPERAGE_CODES,
  COOPERAGE_LABELS,
  type ProductionStationData,
  type StorageStationData,
  type ProcessingStationData,
} from '@/lib/onboarding/schema'
import { saveStep4 } from '@/lib/onboarding/actions'

type TabKey = 'production' | 'storage' | 'processing'

const GRAIN_OPTIONS = ['corn', 'rye', 'wheat', 'malted_barley', 'unmalted_barley', 'oats', 'other']
const STILL_TYPES = [
  { value: 'pot', label: 'Pot Still' },
  { value: 'column', label: 'Column Still' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'doubler', label: 'Doubler / Thumper' },
  { value: 'other', label: 'Other' },
]
const FERMENTER_MATERIALS = [
  { value: 'stainless', label: 'Stainless steel' },
  { value: 'copper', label: 'Copper' },
  { value: 'wood', label: 'Wood' },
  { value: 'polyethylene', label: 'Polyethylene' },
  { value: 'other', label: 'Other' },
]
const WATER_SOURCES = [
  { value: 'municipal', label: 'Municipal / city water' },
  { value: 'well', label: 'Well water' },
  { value: 'spring', label: 'Spring water' },
  { value: 'reverse_osmosis', label: 'Reverse osmosis' },
  { value: 'other', label: 'Other' },
]
const WAREHOUSE_TYPES = [
  { value: 'rick_house', label: 'Rick house' },
  { value: 'palletized', label: 'Palletized' },
  { value: 'barrel_vault', label: 'Barrel vault' },
  { value: 'climate_controlled', label: 'Climate controlled' },
  { value: 'outdoor', label: 'Outdoor' },
  { value: 'other', label: 'Other' },
]
const BOTTLE_SIZE_OPTIONS = [50, 100, 200, 375, 750, 1000, 1750]
const PROCESSING_OPS = [
  { value: 'bottling', label: 'Bottling' },
  { value: 'blending', label: 'Blending barrels' },
  { value: 'carbon_filtration', label: 'Carbon filtration' },
  { value: 'chill_filtration', label: 'Chill filtration' },
  { value: 'proofing', label: 'Proofing / water reduction' },
  { value: 'labeling', label: 'Custom labeling' },
]

function StationPills({ tab, setTab }: { tab: TabKey; setTab: (t: TabKey) => void }) {
  const tabs: Array<{ key: TabKey; label: string }> = [
    { key: 'production', label: 'PRODUCTION' },
    { key: 'storage', label: 'STORAGE' },
    { key: 'processing', label: 'PROCESSING' },
  ]
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-full bg-[#1E2832] border border-white/10 mb-6">
      {tabs.map((t) => (
        <button
          key={t.key}
          type="button"
          onClick={() => setTab(t.key)}
          className={`px-4 py-1.5 text-xs font-mono uppercase tracking-widest rounded-full transition ${
            tab === t.key ? 'bg-[#BA7517] text-white' : 'text-[#E8D5B0]/60 hover:text-white'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}

export function Step4ComplianceStations() {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [tab, setTab] = useState<TabKey>('production')

  const [prod, setProd] = useState<ProductionStationData>({
    fermenter_count: 1,
    fermenters: [{ name: 'Tank 1', capacity_gallons: 200, material: 'stainless' }],
    typical_mash_size_gallons: 200,
    typical_fermentation_days: 5,
    stills: [{ name: 'Pot Still 1', type: 'pot', capacity_gallons: 100 }],
    water_source: 'municipal',
    grain_bill_templates: [
      {
        name: 'Standard Bourbon Mash',
        grains: [
          { type: 'corn', percentage: 75 },
          { type: 'rye', percentage: 13 },
          { type: 'malted_barley', percentage: 12 },
        ],
      },
    ],
    yeast_types: ['dade-yeast'],
    proof_measurement_method: 'digital_hydrometer',
  })

  const [stor, setStor] = useState<StorageStationData>({
    warehouses: [
      { name: 'Rickhouse A', type: 'rick_house', rack_count: 4, bays_per_rack: 8, levels_per_bay: 4, total_positions: 128 },
    ],
    default_cooperage_code: 'C',
    default_oak_origin: 'American White Oak',
    typical_barrel_sizes: [{ size_gallons: 53, count: undefined }],
    typical_entry_proof_min: 115,
    typical_entry_proof_max: 125,
    annual_evaporation_rate_pct: 2.0,
    package_number_prefix: '',
    package_number_sequence: 1,
    package_number_format: '{PREFIX}-{YEAR}-{SEQ:04}',
  })

  const [proc, setProc] = useState<ProcessingStationData>({
    bottle_sizes: [750],
    cola_approvals: [],
    gauging_method: 'hydrometer',
    operations: ['bottling', 'proofing'],
    typical_bottling_loss_pct: 1.0,
    annual_proof_gallons_estimate: undefined,
    tax_deferral_eligible: true,
  })

  const numFmtPreview = `${stor.package_number_prefix || 'WFD'}-${new Date().getFullYear()}-${String(stor.package_number_sequence).padStart(4, '0')}`

  return (
    <OnboardingShell
      step={4}
      title="Configure your three compliance stations."
      intro="Production, Storage, and Processing — set up each station so we can pre-fill barrel entry forms and feed your TTB records automatically."
    >
      <StationPills tab={tab} setTab={setTab} />

      {tab === 'production' && (
        <FormCard className="space-y-5">
          <div className="text-xs text-[#E8D5B0]/60">
            From grain to spirit — feeds daily production records under 27 CFR 19.580.
          </div>
          <FieldGrid>
            <TextField
              label="How many fermentation tanks?"
              type="number"
              value={prod.fermenter_count ? String(prod.fermenter_count) : ''}
              onChange={(v) => setProd({ ...prod, fermenter_count: v ? Number(v) : undefined })}
            />
            <SelectField
              label="Primary water source"
              value={prod.water_source}
              onChange={(v) => setProd({ ...prod, water_source: v })}
              options={WATER_SOURCES}
            />
          </FieldGrid>

          <div>
            <div className="text-xs font-medium text-[#E8D5B0]/80 mb-2">Fermenters</div>
            <div className="space-y-2">
              {prod.fermenters.map((f, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <TextField
                      label="Name"
                      value={f.name}
                      onChange={(v) =>
                        setProd({
                          ...prod,
                          fermenters: prod.fermenters.map((x, idx) => (idx === i ? { ...x, name: v } : x)),
                        })
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <TextField
                      label="Capacity (gal)"
                      type="number"
                      value={String(f.capacity_gallons)}
                      onChange={(v) =>
                        setProd({
                          ...prod,
                          fermenters: prod.fermenters.map((x, idx) => (idx === i ? { ...x, capacity_gallons: Number(v) } : x)),
                        })
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <SelectField
                      label="Material"
                      value={f.material}
                      onChange={(v) =>
                        setProd({
                          ...prod,
                          fermenters: prod.fermenters.map((x, idx) => (idx === i ? { ...x, material: v } : x)),
                        })
                      }
                      options={FERMENTER_MATERIALS}
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => setProd({ ...prod, fermenters: prod.fermenters.filter((_, idx) => idx !== i) })}
                      className="w-full h-[44px] rounded-lg border border-white/10 text-[#E8D5B0]/40 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setProd({
                    ...prod,
                    fermenters: [...prod.fermenters, { name: `Tank ${prod.fermenters.length + 1}`, capacity_gallons: 200, material: 'stainless' }],
                  })
                }
                className="text-xs text-[#BA7517] hover:text-[#D4924A] transition"
              >
                + Add fermenter
              </button>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium text-[#E8D5B0]/80 mb-2">Stills</div>
            <div className="space-y-2">
              {prod.stills.map((s, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5">
                    <TextField
                      label="Name"
                      value={s.name}
                      onChange={(v) =>
                        setProd({ ...prod, stills: prod.stills.map((x, idx) => (idx === i ? { ...x, name: v } : x)) })
                      }
                    />
                  </div>
                  <div className="col-span-3">
                    <SelectField
                      label="Type"
                      value={s.type}
                      onChange={(v) =>
                        setProd({ ...prod, stills: prod.stills.map((x, idx) => (idx === i ? { ...x, type: v } : x)) })
                      }
                      options={STILL_TYPES}
                    />
                  </div>
                  <div className="col-span-3">
                    <TextField
                      label="Capacity (gal)"
                      type="number"
                      value={String(s.capacity_gallons)}
                      onChange={(v) =>
                        setProd({
                          ...prod,
                          stills: prod.stills.map((x, idx) => (idx === i ? { ...x, capacity_gallons: Number(v) } : x)),
                        })
                      }
                    />
                  </div>
                  <div className="col-span-1">
                    <button
                      type="button"
                      onClick={() => setProd({ ...prod, stills: prod.stills.filter((_, idx) => idx !== i) })}
                      className="w-full h-[44px] rounded-lg border border-white/10 text-[#E8D5B0]/40 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setProd({
                    ...prod,
                    stills: [...prod.stills, { name: `Still ${prod.stills.length + 1}`, type: 'pot', capacity_gallons: 100 }],
                  })
                }
                className="text-xs text-[#BA7517] hover:text-[#D4924A] transition"
              >
                + Add still
              </button>
            </div>
          </div>

          <FieldGrid>
            <TextField
              label="Typical mash size (gal)"
              type="number"
              value={prod.typical_mash_size_gallons ? String(prod.typical_mash_size_gallons) : ''}
              onChange={(v) => setProd({ ...prod, typical_mash_size_gallons: v ? Number(v) : undefined })}
            />
            <TextField
              label="Typical fermentation (days)"
              type="number"
              value={prod.typical_fermentation_days ? String(prod.typical_fermentation_days) : ''}
              onChange={(v) => setProd({ ...prod, typical_fermentation_days: v ? Number(v) : undefined })}
            />
          </FieldGrid>

          <div>
            <div className="text-xs font-medium text-[#E8D5B0]/80 mb-2">Grain bill templates</div>
            <div className="space-y-3">
              {prod.grain_bill_templates.map((tpl, ti) => (
                <div key={ti} className="p-3 rounded-lg border border-white/10 bg-[#1E2832]">
                  <div className="flex items-center justify-between mb-2">
                    <TextField
                      label="Template name"
                      value={tpl.name}
                      onChange={(v) =>
                        setProd({
                          ...prod,
                          grain_bill_templates: prod.grain_bill_templates.map((x, idx) =>
                            idx === ti ? { ...x, name: v } : x,
                          ),
                        })
                      }
                      className="flex-1 mr-2"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setProd({
                          ...prod,
                          grain_bill_templates: prod.grain_bill_templates.filter((_, idx) => idx !== ti),
                        })
                      }
                      className="text-xs text-[#E8D5B0]/40 hover:text-white"
                    >
                      Remove
                    </button>
                  </div>
                  {tpl.grains.map((g, gi) => (
                    <div key={gi} className="grid grid-cols-12 gap-2 items-end mb-2">
                      <div className="col-span-7">
                        <SelectField
                          label="Grain"
                          value={g.type}
                          onChange={(v) =>
                            setProd({
                              ...prod,
                              grain_bill_templates: prod.grain_bill_templates.map((x, idx) =>
                                idx === ti
                                  ? {
                                      ...x,
                                      grains: x.grains.map((gg, ggi) => (ggi === gi ? { ...gg, type: v } : gg)),
                                    }
                                  : x,
                              ),
                            })
                          }
                          options={GRAIN_OPTIONS.map((gg) => ({ value: gg, label: gg }))}
                        />
                      </div>
                      <div className="col-span-4">
                        <TextField
                          label="%"
                          type="number"
                          value={String(g.percentage)}
                          onChange={(v) =>
                            setProd({
                              ...prod,
                              grain_bill_templates: prod.grain_bill_templates.map((x, idx) =>
                                idx === ti
                                  ? {
                                      ...x,
                                      grains: x.grains.map((gg, ggi) =>
                                        ggi === gi ? { ...gg, percentage: Number(v) } : gg,
                                      ),
                                    }
                                  : x,
                              ),
                            })
                          }
                        />
                      </div>
                      <div className="col-span-1">
                        <button
                          type="button"
                          onClick={() =>
                            setProd({
                              ...prod,
                              grain_bill_templates: prod.grain_bill_templates.map((x, idx) =>
                                idx === ti ? { ...x, grains: x.grains.filter((_, ggi) => ggi !== gi) } : x,
                              ),
                            })
                          }
                          className="w-full h-[44px] rounded-lg border border-white/10 text-[#E8D5B0]/40 hover:text-white"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      setProd({
                        ...prod,
                        grain_bill_templates: prod.grain_bill_templates.map((x, idx) =>
                          idx === ti ? { ...x, grains: [...x.grains, { type: 'corn', percentage: 0 }] } : x,
                        ),
                      })
                    }
                    className="text-xs text-[#BA7517] hover:text-[#D4924A] transition"
                  >
                    + Add grain row
                  </button>
                  <div className="mt-2 text-[11px] text-[#E8D5B0]/40">
                    Total: {tpl.grains.reduce((s, g) => s + g.percentage, 0)}% (must equal 100)
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setProd({
                    ...prod,
                    grain_bill_templates: [
                      ...prod.grain_bill_templates,
                      { name: 'New Template', grains: [{ type: 'corn', percentage: 100 }] },
                    ],
                  })
                }
                className="text-xs text-[#BA7517] hover:text-[#D4924A] transition"
              >
                + Add template
              </button>
            </div>
          </div>

          <SelectField
            label="Proof measurement method"
            value={prod.proof_measurement_method}
            onChange={(v) => setProd({ ...prod, proof_measurement_method: v })}
            options={[
              { value: 'glass_hydrometer', label: 'Glass hydrometer' },
              { value: 'digital_hydrometer', label: 'Digital hydrometer' },
              { value: 'electronic_density', label: 'Electronic density meter (Anton Paar etc.)' },
            ]}
          />
        </FormCard>
      )}

      {tab === 'storage' && (
        <FormCard className="space-y-5">
          <div className="text-xs text-[#E8D5B0]/60">
            Your bonded warehouse. Required package record per 27 CFR 19.591.
          </div>

          <div>
            <div className="text-xs font-medium text-[#E8D5B0]/80 mb-2">Warehouses</div>
            <div className="space-y-3">
              {stor.warehouses.map((w, i) => (
                <div key={i} className="p-3 rounded-lg border border-white/10 bg-[#1E2832] space-y-2">
                  <FieldGrid>
                    <TextField
                      label="Name"
                      value={w.name}
                      onChange={(v) =>
                        setStor({
                          ...stor,
                          warehouses: stor.warehouses.map((x, idx) => (idx === i ? { ...x, name: v } : x)),
                        })
                      }
                    />
                    <SelectField
                      label="Type"
                      value={w.type}
                      onChange={(v) =>
                        setStor({
                          ...stor,
                          warehouses: stor.warehouses.map((x, idx) => (idx === i ? { ...x, type: v } : x)),
                        })
                      }
                      options={WAREHOUSE_TYPES}
                    />
                  </FieldGrid>
                  <FieldGrid cols={3}>
                    <TextField
                      label="Racks"
                      type="number"
                      value={w.rack_count ? String(w.rack_count) : ''}
                      onChange={(v) =>
                        setStor({
                          ...stor,
                          warehouses: stor.warehouses.map((x, idx) =>
                            idx === i ? { ...x, rack_count: v ? Number(v) : undefined } : x,
                          ),
                        })
                      }
                    />
                    <TextField
                      label="Bays per rack"
                      type="number"
                      value={w.bays_per_rack ? String(w.bays_per_rack) : ''}
                      onChange={(v) =>
                        setStor({
                          ...stor,
                          warehouses: stor.warehouses.map((x, idx) =>
                            idx === i ? { ...x, bays_per_rack: v ? Number(v) : undefined } : x,
                          ),
                        })
                      }
                    />
                    <TextField
                      label="Levels per bay"
                      type="number"
                      value={w.levels_per_bay ? String(w.levels_per_bay) : ''}
                      onChange={(v) =>
                        setStor({
                          ...stor,
                          warehouses: stor.warehouses.map((x, idx) =>
                            idx === i ? { ...x, levels_per_bay: v ? Number(v) : undefined } : x,
                          ),
                        })
                      }
                    />
                  </FieldGrid>
                  <button
                    type="button"
                    onClick={() => setStor({ ...stor, warehouses: stor.warehouses.filter((_, idx) => idx !== i) })}
                    className="text-xs text-[#E8D5B0]/40 hover:text-white"
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setStor({
                    ...stor,
                    warehouses: [
                      ...stor.warehouses,
                      { name: `Warehouse ${String.fromCharCode(65 + stor.warehouses.length)}`, type: 'rick_house' },
                    ],
                  })
                }
                className="text-xs text-[#BA7517] hover:text-[#D4924A] transition"
              >
                + Add warehouse
              </button>
            </div>
          </div>

          <FieldGrid>
            <SelectField
              label="Default cooperage"
              value={stor.default_cooperage_code}
              onChange={(v) => setStor({ ...stor, default_cooperage_code: v })}
              options={COOPERAGE_CODES.map((c) => ({ value: c, label: COOPERAGE_LABELS[c] }))}
            />
            <TextField
              label="Default oak origin"
              value={stor.default_oak_origin}
              onChange={(v) => setStor({ ...stor, default_oak_origin: v })}
              placeholder="American White Oak"
            />
          </FieldGrid>

          <FieldGrid>
            <TextField
              label="Typical entry proof — min"
              type="number"
              value={String(stor.typical_entry_proof_min)}
              onChange={(v) => setStor({ ...stor, typical_entry_proof_min: Number(v) })}
            />
            <TextField
              label="Typical entry proof — max"
              type="number"
              value={String(stor.typical_entry_proof_max)}
              onChange={(v) => setStor({ ...stor, typical_entry_proof_max: Number(v) })}
              hint="TTB maximum for bourbon: 125° (27 CFR 5.4)"
            />
          </FieldGrid>

          <FieldGrid>
            <TextField
              label="Annual evaporation (angel's share) %"
              type="number"
              value={String(stor.annual_evaporation_rate_pct)}
              onChange={(v) => setStor({ ...stor, annual_evaporation_rate_pct: Number(v) })}
            />
            <TextField
              label="Barrel size (gal)"
              type="number"
              value={stor.typical_barrel_sizes[0]?.size_gallons ? String(stor.typical_barrel_sizes[0].size_gallons) : ''}
              onChange={(v) =>
                setStor({ ...stor, typical_barrel_sizes: [{ size_gallons: Number(v) }] })
              }
              hint="Standard whiskey: 53 gal"
            />
          </FieldGrid>

          <div className="p-3 rounded-lg border border-white/10 bg-[#1E2832]">
            <div className="text-xs font-medium text-[#E8D5B0]/80 mb-2">Package numbering</div>
            <FieldGrid>
              <TextField
                label="Prefix"
                value={stor.package_number_prefix}
                onChange={(v) => setStor({ ...stor, package_number_prefix: v })}
                placeholder="WFD"
                hint="Usually distillery initials"
              />
              <TextField
                label="Sequence start"
                type="number"
                value={String(stor.package_number_sequence)}
                onChange={(v) => setStor({ ...stor, package_number_sequence: Number(v) })}
              />
            </FieldGrid>
            <div className="mt-2 text-xs font-mono text-[#BA7517]">Preview: {numFmtPreview}</div>
          </div>
        </FormCard>
      )}

      {tab === 'processing' && (
        <FormCard className="space-y-5">
          <div className="text-xs text-[#E8D5B0]/60">
            Bottling, blending, tax determination. Required records under 27 CFR 19.596.
          </div>

          <CheckboxGroup
            label="Bottle sizes used (ml)"
            options={BOTTLE_SIZE_OPTIONS.map((s) => ({ value: String(s), label: `${s} ml` }))}
            value={proc.bottle_sizes.map(String)}
            onChange={(v) => setProc({ ...proc, bottle_sizes: v.map(Number) })}
          />

          <CheckboxGroup
            label="Processing operations performed"
            options={PROCESSING_OPS}
            value={proc.operations}
            onChange={(v) => setProc({ ...proc, operations: v })}
          />

          <FieldGrid>
            <SelectField
              label="Gauging method"
              value={proc.gauging_method}
              onChange={(v) => setProc({ ...proc, gauging_method: v })}
              options={[
                { value: 'hydrometer', label: 'Glass hydrometer' },
                { value: 'electronic_density', label: 'Electronic density meter' },
              ]}
            />
            <TextField
              label="Typical bottling loss %"
              type="number"
              value={String(proc.typical_bottling_loss_pct)}
              onChange={(v) => setProc({ ...proc, typical_bottling_loss_pct: Number(v) })}
            />
          </FieldGrid>

          <FieldGrid>
            <TextField
              label="Annual proof gallons (est.)"
              type="number"
              value={proc.annual_proof_gallons_estimate ? String(proc.annual_proof_gallons_estimate) : ''}
              onChange={(v) =>
                setProc({ ...proc, annual_proof_gallons_estimate: v ? Number(v) : undefined })
              }
              hint="Drives your federal excise tax tier"
            />
            <div className="space-y-1">
              <label className="block text-xs font-medium text-[#E8D5B0]/80">Tax deferral eligible</label>
              <div className="pt-2">
                <Toggle
                  label="Yes — currently on tax deferral bond"
                  value={proc.tax_deferral_eligible}
                  onChange={(v) => setProc({ ...proc, tax_deferral_eligible: v })}
                />
              </div>
            </div>
          </FieldGrid>

          <div className="text-xs text-[#E8D5B0]/50 italic">
            COLA approvals can be added later from Compliance Settings → Labels.
          </div>
        </FormCard>
      )}

      <NavRow
        onBack={() => router.push('/onboarding/3')}
        onNext={() =>
          start(async () => {
            await saveStep4({ production: prod, storage: stor, processing: proc })
            router.push('/onboarding/5')
          })
        }
        loading={pending}
      />
    </OnboardingShell>
  )
}
