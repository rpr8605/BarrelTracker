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
  TextArea,
  NavRow,
} from '../OnboardingShell'
import { ENTITY_TYPES, OPERATIONS_TYPES, US_STATES, type DSPRegistrationData } from '@/lib/onboarding/schema'
import { saveStep2 } from '@/lib/onboarding/actions'

const OP_LABELS: Record<string, string> = {
  producer: 'Producer (distilling)',
  warehouseman: 'Warehouseman (bonded storage)',
  processor: 'Processor (bottling / blending)',
}

export function Step2DSPRegistration({ initial }: { initial?: Partial<DSPRegistrationData> }) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [d, setD] = useState<DSPRegistrationData>({
    dsp_number: initial?.dsp_number ?? '',
    dsp_permit_date: initial?.dsp_permit_date ?? '',
    ein: initial?.ein ?? '',
    entity_type: initial?.entity_type ?? '',
    principal_name: initial?.principal_name ?? '',
    principal_title: initial?.principal_title ?? '',
    operations_type: initial?.operations_type ?? [],
    street_address: initial?.street_address ?? '',
    city: initial?.city ?? '',
    state: initial?.state ?? '',
    zip: initial?.zip ?? '',
    county: initial?.county ?? '',
    mailing_same: initial?.mailing_same ?? true,
    mailing_address: initial?.mailing_address ?? '',
    mailing_city: initial?.mailing_city ?? '',
    mailing_state: initial?.mailing_state ?? '',
    mailing_zip: initial?.mailing_zip ?? '',
    plant_name: initial?.plant_name ?? '',
    trade_name: initial?.trade_name ?? '',
    spirits_categories: initial?.spirits_categories ?? [],
    is_ndp: initial?.is_ndp ?? false,
    ndp_source_details: initial?.ndp_source_details ?? '',
  })

  return (
    <OnboardingShell
      step={2}
      title="Your DSP registration."
      intro="Your Distilled Spirits Plant number is issued by the TTB. You can find it on your DSP permit. Skip if you don't have it handy — TTB features will activate when you complete this section in Settings."
    >
      <FormCard className="space-y-5">
        <FieldGrid>
          <TextField
            label="DSP number"
            value={d.dsp_number}
            onChange={(v) => setD({ ...d, dsp_number: v })}
            hint="Format: DSP-[STATE]-[NUMBER]"
            placeholder="DSP-KY-20081"
          />
          <TextField
            label="Permit effective date"
            type="date"
            value={d.dsp_permit_date}
            onChange={(v) => setD({ ...d, dsp_permit_date: v })}
          />
        </FieldGrid>

        <FieldGrid>
          <TextField label="EIN" value={d.ein} onChange={(v) => setD({ ...d, ein: v })} placeholder="XX-XXXXXXX" />
          <SelectField
            label="Entity type"
            value={d.entity_type}
            onChange={(v) => setD({ ...d, entity_type: v })}
            options={ENTITY_TYPES.map((e) => ({ value: e, label: e }))}
          />
        </FieldGrid>

        <FieldGrid>
          <TextField
            label="Principal name"
            value={d.principal_name}
            onChange={(v) => setD({ ...d, principal_name: v })}
            required
          />
          <TextField
            label="Principal title"
            value={d.principal_title}
            onChange={(v) => setD({ ...d, principal_title: v })}
            required
            placeholder="Owner, CEO, etc."
          />
        </FieldGrid>

        <CheckboxGroup
          label="Operations authorized"
          options={OPERATIONS_TYPES.map((o) => ({ value: o, label: OP_LABELS[o] }))}
          value={d.operations_type}
          onChange={(v) => setD({ ...d, operations_type: v })}
        />

        <div className="border-t border-white/5 pt-4 space-y-3">
          <Toggle
            label="Non-Distilling Producer (NDP)"
            value={!!d.is_ndp}
            onChange={(v) => setD({ ...d, is_ndp: v })}
            hint="You source distillate from another DSP and bottle, blend, or age it yourself without distilling. Common for sourced bourbon brands."
          />
          {d.is_ndp && (
            <TextArea
              label="Distillate sourcing details"
              value={d.ndp_source_details}
              onChange={(v) => setD({ ...d, ndp_source_details: v })}
              hint="Where you source from — e.g., MGP Indiana, Bardstown Bourbon Company contract distillation. Used for label disclosure compliance (27 CFR 5.36(d))."
              rows={3}
            />
          )}
        </div>
      </FormCard>

      <div className="mt-4" />
      <FormCard className="space-y-5">
        <div className="text-xs uppercase tracking-widest text-[#BA7517] font-mono">PLANT ADDRESS</div>
        <TextField
          label="Street address"
          value={d.street_address}
          onChange={(v) => setD({ ...d, street_address: v })}
        />
        <FieldGrid cols={3}>
          <TextField label="City" value={d.city} onChange={(v) => setD({ ...d, city: v })} />
          <SelectField
            label="State"
            value={d.state}
            onChange={(v) => setD({ ...d, state: v })}
            options={US_STATES.map((s) => ({ value: s, label: s }))}
          />
          <TextField label="ZIP" value={d.zip} onChange={(v) => setD({ ...d, zip: v })} />
        </FieldGrid>
        <TextField label="County" value={d.county} onChange={(v) => setD({ ...d, county: v })} />

        <Toggle
          label="Mailing address same as plant"
          value={d.mailing_same}
          onChange={(v) => setD({ ...d, mailing_same: v })}
        />

        {!d.mailing_same && (
          <div className="space-y-4">
            <TextField
              label="Mailing street"
              value={d.mailing_address}
              onChange={(v) => setD({ ...d, mailing_address: v })}
            />
            <FieldGrid cols={3}>
              <TextField label="City" value={d.mailing_city} onChange={(v) => setD({ ...d, mailing_city: v })} />
              <SelectField
                label="State"
                value={d.mailing_state}
                onChange={(v) => setD({ ...d, mailing_state: v })}
                options={US_STATES.map((s) => ({ value: s, label: s }))}
              />
              <TextField label="ZIP" value={d.mailing_zip} onChange={(v) => setD({ ...d, mailing_zip: v })} />
            </FieldGrid>
          </div>
        )}
      </FormCard>

      <NavRow
        onBack={() => router.push('/onboarding/1')}
        onSkip={() =>
          start(async () => {
            await saveStep2({ ...d, dsp_skipped: true })
            router.push('/onboarding/3')
          })
        }
        onNext={() =>
          start(async () => {
            await saveStep2(d)
            router.push('/onboarding/3')
          })
        }
        loading={pending}
      />
    </OnboardingShell>
  )
}
