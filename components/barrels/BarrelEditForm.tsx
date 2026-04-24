'use client'
import { useState } from 'react'
import { Input, Select } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase'
import type { Barrel } from '@/types/database'

const STATUSES = ['aging', 'ready', 'bottled', 'dumped']
const FINISH_OPTIONS = ['none', 'Port Finish', 'Sherry Finish', 'Rum Finish', 'Wine Finish', 'Double Oaked', 'Toasted Finish', 'Madeira Finish', 'Cognac Finish']

export function BarrelEditForm({ barrel, onSave }: { barrel: Barrel; onSave: (b: Barrel) => void }) {
  const [form, setForm] = useState({
    barrel_number: barrel.barrel_number,
    mash_bill: barrel.mash_bill || '',
    distillery_source: barrel.distillery_source || '',
    entry_date: barrel.entry_date || '',
    entry_proof: barrel.entry_proof?.toString() || '',
    current_proof_estimate: barrel.current_proof_estimate?.toString() || '',
    warehouse_row: barrel.warehouse_row || '',
    warehouse_slot: barrel.warehouse_slot?.toString() || '',
    warehouse_tier: barrel.warehouse_tier?.toString() || '',
    status: barrel.status,
    finish_type: barrel.finish_type || 'none',
    predicted_peak_date: barrel.predicted_peak_date || '',
    notes: barrel.notes || '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  async function save() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase
      .from('barrels')
      .update({
        barrel_number: form.barrel_number,
        mash_bill: form.mash_bill || null,
        distillery_source: form.distillery_source || null,
        entry_date: form.entry_date || null,
        entry_proof: form.entry_proof ? parseFloat(form.entry_proof) : null,
        current_proof_estimate: form.current_proof_estimate ? parseFloat(form.current_proof_estimate) : null,
        warehouse_row: form.warehouse_row || null,
        warehouse_slot: form.warehouse_slot ? parseInt(form.warehouse_slot) : null,
        warehouse_tier: form.warehouse_tier ? parseInt(form.warehouse_tier) : null,
        status: form.status,
        finish_type: form.finish_type,
        predicted_peak_date: form.predicted_peak_date || null,
        notes: form.notes || null,
      })
      .eq('id', barrel.id)
      .select()
      .single()

    setSaving(false)
    if (error) { setError(error.message); return }
    onSave(data as Barrel)
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Input label="Barrel number" value={form.barrel_number} onChange={(e) => set('barrel_number', e.target.value)} />
        <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value)}>
          {STATUSES.map((s) => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </Select>
        <Input label="Mash bill" value={form.mash_bill} onChange={(e) => set('mash_bill', e.target.value)} className="col-span-2" />
        <Input label="Distillery source" value={form.distillery_source} onChange={(e) => set('distillery_source', e.target.value)} />
        <Select label="Finish" value={form.finish_type} onChange={(e) => set('finish_type', e.target.value)}>
          {FINISH_OPTIONS.map((f) => <option key={f} value={f}>{f === 'none' ? 'None' : f}</option>)}
        </Select>
        <Input label="Fill date" type="date" value={form.entry_date} onChange={(e) => set('entry_date', e.target.value)} />
        <Input label="Peak date (predicted)" type="date" value={form.predicted_peak_date} onChange={(e) => set('predicted_peak_date', e.target.value)} />
        <Input label="Entry proof" type="number" value={form.entry_proof} onChange={(e) => set('entry_proof', e.target.value)} />
        <Input label="Current proof est." type="number" value={form.current_proof_estimate} onChange={(e) => set('current_proof_estimate', e.target.value)} />
        <Input label="Row" value={form.warehouse_row} onChange={(e) => set('warehouse_row', e.target.value)} />
        <div className="grid grid-cols-2 gap-2">
          <Input label="Slot" type="number" value={form.warehouse_slot} onChange={(e) => set('warehouse_slot', e.target.value)} />
          <Input label="Tier" type="number" value={form.warehouse_tier} onChange={(e) => set('warehouse_tier', e.target.value)} />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-[var(--color-text)] mb-1">Notes</label>
        <textarea
          value={form.notes}
          onChange={(e) => set('notes', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm text-[var(--color-text)] outline-none focus:border-primary resize-none"
        />
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
      <Button onClick={save} loading={saving} className="w-full">Save changes</Button>
    </div>
  )
}
