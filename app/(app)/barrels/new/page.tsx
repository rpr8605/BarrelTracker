'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TagChip } from '@/components/ui/Badge'
import { LabelScanner } from '@/components/barrels/LabelScanner'
import { createClient } from '@/lib/supabase'
import type { ExtractedLabel } from '@/components/barrels/LabelScanner'

const GRAIN_OPTIONS = ['Wheat', 'High Wheat', 'Corn', 'High Corn', 'Rye', 'High Rye', 'Malted Rye', 'Barley', 'Four Grain', 'Heirloom Corn']
const FINISH_OPTIONS = ['None', 'Port Finish', 'Sherry Finish', 'Rum Finish', 'Wine Finish', 'Double Oaked', 'Toasted Finish']
const SOURCE_OPTIONS = ['', 'MGP', 'Buffalo Trace', 'Heaven Hill', 'Willett', 'New Riff', 'Wild Turkey', 'Four Roses', 'Beam', 'Castle & Key', 'Limestone Branch', 'Wilderness Trail', 'Smooth Ambler']

export default function NewBarrelPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    barrel_number: '',
    entry_date: new Date().toISOString().split('T')[0],
    mash_bill: '',
    grain_type: [] as string[],
    distillery_source: '',
    entry_proof: '',
    warehouse_row: '',
    warehouse_slot: '',
    warehouse_tier: '',
    finish_type: 'None',
    notes: '',
  })

  function set(k: string, v: unknown) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function toggleGrain(g: string) {
    set('grain_type', form.grain_type.includes(g) ? form.grain_type.filter((x) => x !== g) : [...form.grain_type, g])
  }

  function applyLabel(data: ExtractedLabel) {
    if (data.barrel_number) set('barrel_number', data.barrel_number)
    if (data.mash_bill) set('mash_bill', data.mash_bill)
    if (data.distillery_source) set('distillery_source', data.distillery_source)
    if (data.entry_date) set('entry_date', data.entry_date)
    if (data.entry_proof) set('entry_proof', String(data.entry_proof))
    if (data.notes) set('notes', data.notes)
  }

  async function getDistilleryId(supabase: ReturnType<typeof createClient>, userId: string) {
    // Try owner first
    const { data: owned } = await supabase.from('distilleries').select('id').eq('owner_id', userId).limit(1).single()
    if (owned) return owned.id
    // Try member role
    const { data: role } = await supabase.from('user_roles').select('distillery_id').eq('user_id', userId).limit(1).single()
    return role?.distillery_id ?? null
  }

  async function save() {
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const distilleryId = await getDistilleryId(supabase, user!.id)
      const distillery = distilleryId ? { id: distilleryId } : null

      if (!distillery) { setError('Set up a distillery first'); setSaving(false); return }

      const { data: barrel, error: err } = await supabase.from('barrels').insert({
        distillery_id: distillery!.id,
        barrel_number: form.barrel_number,
        entry_date: form.entry_date || null,
        mash_bill: form.mash_bill || null,
        grain_type: form.grain_type.length ? form.grain_type : null,
        distillery_source: form.distillery_source || null,
        entry_proof: form.entry_proof ? parseFloat(form.entry_proof) : null,
        warehouse_row: form.warehouse_row || null,
        warehouse_slot: form.warehouse_slot ? parseInt(form.warehouse_slot) : null,
        warehouse_tier: form.warehouse_tier ? parseInt(form.warehouse_tier) : null,
        finish_type: form.finish_type === 'None' ? 'none' : form.finish_type,
        notes: form.notes || null,
        status: 'aging',
      }).select().single()

      if (err) throw new Error(err.message)

      // Fire AI tag extraction in background
      fetch('/api/ai/extract-tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ barrel_data: form, barrel_id: barrel.id }),
      }).catch(() => {})

      router.push(`/barrels/${barrel.id}`)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setSaving(false)
    }
  }

  const steps = [
    { n: 1, label: 'Barrel info' },
    { n: 2, label: 'Grain' },
    { n: 3, label: 'Source' },
    { n: 4, label: 'Location' },
    { n: 5, label: 'Finish' },
    { n: 6, label: 'Review' },
  ]

  return (
    <div className="max-w-lg mx-auto">
      <div className="flex gap-1 mb-6">
        {steps.map(({ n, label }) => (
          <div key={n} className="flex-1 flex flex-col items-center gap-1">
            <div className={`w-full h-1 rounded-full ${n <= step ? 'bg-primary' : 'bg-[var(--color-border)]'}`} />
            <span className="text-[10px] text-[var(--color-text-muted)] hidden sm:block">{label}</span>
          </div>
        ))}
      </div>

      <Card className="p-5">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-medium">Barrel info</h2>
            <div className="rounded-lg border border-dashed border-[var(--color-border)] p-3">
              <p className="text-xs text-[var(--color-text-muted)] mb-2">Snap a photo of the barrel label to auto-fill</p>
              <LabelScanner onExtracted={applyLabel} />
            </div>
            <Input label="Barrel number *" value={form.barrel_number} onChange={(e) => set('barrel_number', e.target.value)} placeholder="e.g. CR-041" />
            <Input label="Fill date" type="date" value={form.entry_date} onChange={(e) => set('entry_date', e.target.value)} />
            <Input label="Mash bill" value={form.mash_bill} onChange={(e) => set('mash_bill', e.target.value)} placeholder="e.g. 75% corn, 21% rye, 4% malt" />
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-medium">Grain type</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Select all that apply</p>
            <div className="flex flex-wrap gap-2">
              {GRAIN_OPTIONS.map((g) => (
                <button
                  key={g}
                  onClick={() => toggleGrain(g)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all min-h-[36px] ${
                    form.grain_type.includes(g) ? 'bg-primary text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-medium">Distillery source</h2>
            <div className="grid grid-cols-2 gap-2">
              {SOURCE_OPTIONS.filter(Boolean).map((s) => (
                <button
                  key={s}
                  onClick={() => set('distillery_source', s)}
                  className={`px-3 py-2 rounded-lg text-sm text-left transition-all min-h-[44px] ${
                    form.distillery_source === s ? 'bg-primary text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            <Input
              label="Or enter custom source"
              value={form.distillery_source}
              onChange={(e) => set('distillery_source', e.target.value)}
              placeholder="Custom distillery name"
            />
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-medium">Warehouse location</h2>
            <Input label="Entry proof" type="number" value={form.entry_proof} onChange={(e) => set('entry_proof', e.target.value)} placeholder="e.g. 125" />
            <div className="grid grid-cols-3 gap-3">
              <Input label="Row" value={form.warehouse_row} onChange={(e) => set('warehouse_row', e.target.value)} placeholder="A" />
              <Input label="Slot" type="number" value={form.warehouse_slot} onChange={(e) => set('warehouse_slot', e.target.value)} placeholder="12" />
              <Input label="Tier" type="number" value={form.warehouse_tier} onChange={(e) => set('warehouse_tier', e.target.value)} placeholder="3" />
            </div>
          </div>
        )}

        {step === 5 && (
          <div className="space-y-4">
            <h2 className="font-medium">Finish type</h2>
            <div className="grid grid-cols-2 gap-2">
              {FINISH_OPTIONS.map((f) => (
                <button
                  key={f}
                  onClick={() => set('finish_type', f)}
                  className={`px-3 py-2 rounded-lg text-sm text-left transition-all min-h-[44px] ${
                    form.finish_type === f ? 'bg-primary text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <Input label="Notes (optional)" value={form.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Any initial observations..." />
          </div>
        )}

        {step === 6 && (
          <div className="space-y-4">
            <h2 className="font-medium">Review</h2>
            <div className="space-y-2 text-sm">
              {[
                ['Barrel', form.barrel_number],
                ['Fill date', form.entry_date],
                ['Mash bill', form.mash_bill],
                ['Grain', form.grain_type.join(', ')],
                ['Source', form.distillery_source],
                ['Entry proof', form.entry_proof],
                ['Location', form.warehouse_row ? `Row ${form.warehouse_row} / Slot ${form.warehouse_slot} / Tier ${form.warehouse_tier}` : '—'],
                ['Finish', form.finish_type],
              ].map(([l, v]) => v ? (
                <div key={l} className="flex justify-between border-b border-[var(--color-border)] pb-1.5">
                  <span className="text-[var(--color-text-muted)]">{l}</span>
                  <span className="text-[var(--color-text)] font-medium">{v}</span>
                </div>
              ) : null)}
            </div>
            {error && <p className="text-sm text-danger">{error}</p>}
          </div>
        )}

        <div className="flex gap-3 mt-6">
          {step > 1 && (
            <Button variant="secondary" onClick={() => setStep((s) => s - 1)} className="flex-1">Back</Button>
          )}
          {step < 6 ? (
            <Button
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && !form.barrel_number}
              className="flex-1"
            >
              Continue
            </Button>
          ) : (
            <Button onClick={save} loading={saving} className="flex-1" disabled={!form.barrel_number}>
              Save barrel
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
