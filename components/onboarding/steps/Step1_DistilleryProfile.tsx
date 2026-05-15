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
  CheckboxGroup,
  NavRow,
} from '../OnboardingShell'
import { SPIRITS_OPTIONS, US_STATES, type DistilleryProfileData } from '@/lib/onboarding/schema'
import { saveStep1 } from '@/lib/onboarding/actions'

const SPIRITS_LABELS: Record<string, string> = {
  bourbon: 'Bourbon / Whiskey',
  rye: 'Rye',
  wheat_whiskey: 'Wheat Whiskey',
  corn_whiskey: 'Corn Whiskey',
  malt_whiskey: 'Single Malt',
  brandy: 'Brandy',
  rum: 'Rum',
  gin: 'Gin',
  vodka: 'Vodka',
  specialty: 'Specialty / Moonshine',
}

export function Step1DistilleryProfile({ initial, email }: { initial?: Partial<DistilleryProfileData>; email: string }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [d, setD] = useState<DistilleryProfileData>({
    distillery_name: initial?.distillery_name ?? '',
    trade_name: initial?.trade_name ?? '',
    website: initial?.website ?? '',
    phone: initial?.phone ?? '',
    email: initial?.email ?? email,
    founding_year: initial?.founding_year,
    description: initial?.description ?? '',
    spirits_produced: initial?.spirits_produced ?? [],
    barrel_count_estimate: initial?.barrel_count_estimate,
    state: initial?.state ?? '',
  })

  const valid = d.distillery_name.trim() && d.email.trim() && d.phone.trim() && d.state

  return (
    <OnboardingShell
      step={1}
      title="Let's set up your distillery."
      intro="Basic identity information — used on consumer-facing pages and TTB records. You can edit any of this later in Settings."
    >
      <FormCard className="space-y-5">
        <FieldGrid>
          <TextField
            label="Legal distillery name"
            value={d.distillery_name}
            onChange={(v) => setD({ ...d, distillery_name: v })}
            required
          />
          <TextField
            label="Trade name / DBA"
            value={d.trade_name}
            onChange={(v) => setD({ ...d, trade_name: v })}
            hint="If you operate under a different brand name"
          />
        </FieldGrid>

        <FieldGrid>
          <TextField label="Primary phone" value={d.phone} onChange={(v) => setD({ ...d, phone: v })} required />
          <TextField label="Primary email" type="email" value={d.email} onChange={(v) => setD({ ...d, email: v })} required />
        </FieldGrid>

        <FieldGrid cols={3}>
          <TextField label="Website" value={d.website} onChange={(v) => setD({ ...d, website: v })} placeholder="https://" />
          <TextField
            label="Founding year"
            type="number"
            value={d.founding_year ? String(d.founding_year) : ''}
            onChange={(v) => setD({ ...d, founding_year: v ? Number(v) : undefined })}
          />
          <SelectField
            label="State of operation"
            value={d.state}
            onChange={(v) => setD({ ...d, state: v })}
            options={US_STATES.map((s) => ({ value: s, label: s }))}
            required
          />
        </FieldGrid>

        <TextArea
          label="Short description (used on your public profile)"
          value={d.description}
          onChange={(v) => setD({ ...d, description: v })}
          maxLength={500}
          rows={3}
          hint={`${d.description?.length ?? 0} / 500 — appears on barrel story pages and consumer profile.`}
        />

        <CheckboxGroup
          label="Spirits you produce"
          options={SPIRITS_OPTIONS.map((s) => ({ value: s, label: SPIRITS_LABELS[s] }))}
          value={d.spirits_produced}
          onChange={(v) => setD({ ...d, spirits_produced: v })}
        />

        <TextField
          label="Approximate current barrel inventory"
          type="number"
          value={d.barrel_count_estimate ? String(d.barrel_count_estimate) : ''}
          onChange={(v) => setD({ ...d, barrel_count_estimate: v ? Number(v) : undefined })}
          hint="Helps us right-size your plan and warehouse setup."
        />
      </FormCard>

      <NavRow
        onNext={() =>
          start(async () => {
            await saveStep1(d)
            router.push('/onboarding/2')
          })
        }
        nextDisabled={!valid}
        loading={pending}
      />
    </OnboardingShell>
  )
}
