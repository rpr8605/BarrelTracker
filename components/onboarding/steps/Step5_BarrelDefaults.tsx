'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  OnboardingShell,
  FormCard,
  FieldGrid,
  TextField,
  SelectField,
  Toggle,
  NavRow,
} from '../OnboardingShell'
import { COOPERAGE_CODES, COOPERAGE_LABELS, type BarrelDefaultsData } from '@/lib/onboarding/schema'
import { saveStep5 } from '@/lib/onboarding/actions'

const SPIRIT_TYPES = [
  { value: 'bourbon', label: 'Bourbon Whiskey' },
  { value: 'rye_whiskey', label: 'Rye Whiskey' },
  { value: 'wheat_whiskey', label: 'Wheat Whiskey' },
  { value: 'corn_whiskey', label: 'Corn Whiskey' },
  { value: 'malt_whiskey', label: 'Malt Whiskey' },
  { value: 'brandy', label: 'Brandy' },
  { value: 'rum', label: 'Rum' },
  { value: 'specialty', label: 'Specialty' },
]

export function Step5BarrelDefaults({
  warehouses,
  templates,
  proofDefault,
  cooperageDefault,
}: {
  warehouses: string[]
  templates: string[]
  proofDefault?: number
  cooperageDefault?: string
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [nfcChoice, setNfcChoice] = useState<'have' | 'order' | 'skip' | undefined>()
  const [d, setD] = useState<BarrelDefaultsData>({
    default_spirits_type: 'bourbon',
    default_cooperage_code: cooperageDefault ?? 'C',
    default_grain_bill_template: templates[0],
    default_entry_proof: proofDefault,
    default_warehouse: warehouses[0],
    auto_generate_serial: true,
    require_nfc_on_entry: false,
  })

  return (
    <OnboardingShell
      step={5}
      title="Set your barrel entry defaults."
      intro="These pre-fill the barrel form every time you log a new barrel. Override on the fly when needed — these just save time."
    >
      <FormCard className="space-y-5">
        <FieldGrid>
          <SelectField
            label="Default spirits type"
            value={d.default_spirits_type}
            onChange={(v) => setD({ ...d, default_spirits_type: v })}
            options={SPIRIT_TYPES}
          />
          <SelectField
            label="Default cooperage"
            value={d.default_cooperage_code}
            onChange={(v) => setD({ ...d, default_cooperage_code: v })}
            options={COOPERAGE_CODES.map((c) => ({ value: c, label: COOPERAGE_LABELS[c] }))}
          />
        </FieldGrid>
        <FieldGrid>
          <SelectField
            label="Default grain bill template"
            value={d.default_grain_bill_template}
            onChange={(v) => setD({ ...d, default_grain_bill_template: v })}
            options={[{ value: '', label: '— None —' }, ...templates.map((t) => ({ value: t, label: t }))]}
          />
          <TextField
            label="Default entry proof"
            type="number"
            value={d.default_entry_proof ? String(d.default_entry_proof) : ''}
            onChange={(v) => setD({ ...d, default_entry_proof: v ? Number(v) : undefined })}
            hint="TTB max for bourbon: 125"
          />
        </FieldGrid>
        <SelectField
          label="Default warehouse"
          value={d.default_warehouse}
          onChange={(v) => setD({ ...d, default_warehouse: v })}
          options={warehouses.map((w) => ({ value: w, label: w }))}
        />

        <div className="border-t border-white/5 pt-4 space-y-3">
          <Toggle
            label="Auto-generate serial numbers"
            value={d.auto_generate_serial}
            onChange={(v) => setD({ ...d, auto_generate_serial: v })}
            hint="Uses the format you set in the Storage station"
          />
          <Toggle
            label="Require NFC tag link before finalizing"
            value={d.require_nfc_on_entry}
            onChange={(v) => setD({ ...d, require_nfc_on_entry: v })}
            hint="Enable once you have NFC tags deployed"
          />
        </div>
      </FormCard>

      <div className="mt-4" />
      <FormCard className="space-y-3">
        <div className="text-sm text-white">🔵 NFC tag setup</div>
        <div className="text-xs text-[#E8D5B0]/60">Do you have NFC tags ready to install?</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          {[
            { v: 'have' as const, label: '✅ Yes, I have tags', sub: 'Configure NFC linking in app' },
            { v: 'order' as const, label: '📦 I need to order tags', sub: 'See recommended product' },
            { v: 'skip' as const, label: '⏭️ Skip for now', sub: 'I\'ll set it up later' },
          ].map((o) => (
            <button
              key={o.v}
              type="button"
              onClick={() => {
                setNfcChoice(o.v)
                setD({ ...d, nfc_choice: o.v })
              }}
              className={`text-left p-3 rounded-lg border transition ${
                nfcChoice === o.v
                  ? 'border-[#BA7517] bg-[#BA7517]/10'
                  : 'border-white/10 bg-[#1E2832] hover:border-white/20'
              }`}
            >
              <div className="text-sm text-white">{o.label}</div>
              <div className="text-[11px] text-[#E8D5B0]/50 mt-0.5">{o.sub}</div>
            </button>
          ))}
        </div>

        {nfcChoice === 'order' && (
          <div className="mt-2 p-3 rounded-lg border border-white/10 bg-[#1E2832] text-xs text-[#E8D5B0]/70 leading-relaxed">
            <strong className="text-white">Recommended:</strong> NTAG215 chip, 25mm round, IP67 self-adhesive. Works
            on every iPhone (XS+) and Android device with NFC. Available in 100-packs from common suppliers — search
            "NTAG215 25mm waterproof sticker."
          </div>
        )}
      </FormCard>

      <NavRow
        onBack={() => router.push('/onboarding/4')}
        onNext={() =>
          start(async () => {
            await saveStep5(d)
            router.push('/onboarding/complete')
          })
        }
        nextLabel="Finish setup"
        loading={pending}
      />
    </OnboardingShell>
  )
}
