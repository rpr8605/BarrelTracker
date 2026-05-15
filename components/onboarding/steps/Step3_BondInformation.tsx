'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  OnboardingShell,
  FormCard,
  FieldGrid,
  TextField,
  SelectField,
  TextArea,
  Toggle,
  NavRow,
} from '../OnboardingShell'
import type { BondData } from '@/lib/onboarding/schema'
import { saveStep3 } from '@/lib/onboarding/actions'

const BOND_OPTIONS = [
  { value: 'operations', label: 'Operations Bond (most common)' },
  { value: 'unit_bond', label: 'Unit Bond' },
  { value: 'tax_deferral', label: 'Tax Deferral Bond' },
  { value: 'waiver', label: 'Bond Waiver (< 50,000 PG/yr)' },
]

export function Step3BondInformation({ initial }: { initial?: Partial<BondData> }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [d, setD] = useState<BondData>({
    bond_type: (initial?.bond_type as BondData['bond_type']) ?? 'operations',
    bond_number: initial?.bond_number ?? '',
    surety_company: initial?.surety_company ?? '',
    bond_amount: initial?.bond_amount,
    penal_sum: initial?.penal_sum,
    effective_date: initial?.effective_date ?? '',
    expiration_date: initial?.expiration_date ?? '',
    renewal_required: initial?.renewal_required ?? true,
    notes: initial?.notes ?? '',
  })

  const isWaiver = d.bond_type === 'waiver'
  const valid = isWaiver || (d.bond_number && d.surety_company && d.bond_amount && d.effective_date)

  return (
    <OnboardingShell
      step={3}
      title="Bond information."
      intro="TTB requires most DSPs to maintain an operations bond or qualify for waiver. Enter your current bond details below — Still will remind you 60 days before expiration."
    >
      <div className="mb-4 px-4 py-3 rounded-lg border border-[#BA7517]/30 bg-[#BA7517]/10 text-sm text-[#E8D5B0]">
        ⚠ <strong>Bond renewal reminder.</strong> An expired bond creates an automatic compliance violation and can
        result in permit suspension. We'll alert you 60 days before expiration.
      </div>

      <FormCard className="space-y-5">
        <SelectField
          label="Bond type"
          value={d.bond_type}
          onChange={(v) => setD({ ...d, bond_type: v as BondData['bond_type'] })}
          options={BOND_OPTIONS}
          required
        />

        {!isWaiver && (
          <>
            <FieldGrid>
              <TextField
                label="Bond number"
                value={d.bond_number}
                onChange={(v) => setD({ ...d, bond_number: v })}
                required
              />
              <TextField
                label="Surety company"
                value={d.surety_company}
                onChange={(v) => setD({ ...d, surety_company: v })}
                required
              />
            </FieldGrid>

            <FieldGrid>
              <TextField
                label="Bond amount"
                type="number"
                value={d.bond_amount ? String(d.bond_amount) : ''}
                onChange={(v) => setD({ ...d, bond_amount: v ? Number(v) : undefined })}
                required
                placeholder="$"
              />
              <TextField
                label="Penal sum (if different)"
                type="number"
                value={d.penal_sum ? String(d.penal_sum) : ''}
                onChange={(v) => setD({ ...d, penal_sum: v ? Number(v) : undefined })}
              />
            </FieldGrid>

            <FieldGrid>
              <TextField
                label="Effective date"
                type="date"
                value={d.effective_date}
                onChange={(v) => setD({ ...d, effective_date: v })}
                required
              />
              <TextField
                label="Expiration date"
                type="date"
                value={d.expiration_date}
                onChange={(v) => setD({ ...d, expiration_date: v })}
                hint="Leave blank if continuous"
              />
            </FieldGrid>

            <Toggle
              label="Requires annual renewal"
              value={d.renewal_required ?? true}
              onChange={(v) => setD({ ...d, renewal_required: v })}
            />
          </>
        )}

        <TextArea
          label="Notes"
          value={d.notes}
          onChange={(v) => setD({ ...d, notes: v })}
          hint="Renewal status, pending changes, etc."
        />
      </FormCard>

      <NavRow
        onBack={() => router.push('/onboarding/2')}
        onNext={() =>
          start(async () => {
            await saveStep3(d)
            router.push('/onboarding/4')
          })
        }
        nextDisabled={!valid}
        loading={pending}
      />
    </OnboardingShell>
  )
}
