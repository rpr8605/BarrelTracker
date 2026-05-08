'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase'
import { getMyDistilleryId } from '@/lib/distillery'

function monthOptions() {
  const opts = []
  const now = new Date()
  for (let i = 1; i <= 36; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    opts.push({ value: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) })
  }
  return opts
}

export default function BalanceWizardPage() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [rows, setRows] = useState([{ report_month: monthOptions()[0].value, production_ending_pg: '', storage_ending_pg: '', processing_ending_pg: '', notes: '' }])

  function addRow() {
    setRows((r) => [...r, { report_month: monthOptions()[r.length]?.value ?? monthOptions()[0].value, production_ending_pg: '', storage_ending_pg: '', processing_ending_pg: '', notes: '' }])
  }

  function updateRow(i: number, k: string, v: string) {
    setRows((r) => r.map((row, idx) => idx === i ? { ...row, [k]: v } : row))
  }

  function removeRow(i: number) {
    setRows((r) => r.filter((_, idx) => idx !== i))
  }

  async function save() {
    setSaving(true)
    setError('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Not logged in'); setSaving(false); return }
    const distilleryId = await getMyDistilleryId(supabase, user.id)
    if (!distilleryId) { setError('No distillery found'); setSaving(false); return }

    for (const row of rows) {
      const res = await fetch('/api/compliance/balance-wizard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ distillery_id: distilleryId, ...row }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(`${row.report_month}: ${d.error}`)
        setSaving(false)
        return
      }
    }

    setSuccess(true)
    setSaving(false)
  }

  const months = monthOptions()

  if (success) {
    return (
      <div className="max-w-lg mx-auto">
        <Card className="p-6 text-center space-y-4">
          <div className="text-4xl">✓</div>
          <h2 className="font-semibold text-lg">Historical balances imported</h2>
          <p className="text-sm text-[var(--color-text-muted)]">
            {rows.length} period{rows.length > 1 ? 's' : ''} saved. Month-over-month continuity checks will now use these as starting points.
          </p>
          <Button onClick={() => router.push('/compliance')}>Back to Compliance</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Historical Balance Import</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">
          Enter your most recent filed TTB report ending balances. This lets Still verify month-over-month continuity (TTB auditors check this first).
        </p>
      </div>

      <Card className="p-4 space-y-3 text-sm bg-amber-500/5 border-amber-500/20">
        <p className="font-medium text-amber-400">Where to find these numbers</p>
        <ul className="space-y-1 text-[var(--color-text-muted)] list-disc list-inside">
          <li><strong>Production (5110.40)</strong> — Line 23: "On hand end of month"</li>
          <li><strong>Storage (5110.11)</strong> — Line 24: "On hand end of month"</li>
          <li><strong>Processing (5110.28)</strong> — Last line: "On hand end of period"</li>
        </ul>
        <p className="text-[var(--color-text-muted)]">Enter the most recent month you filed. You can add multiple months if you want a longer history.</p>
      </Card>

      <div className="space-y-3">
        {rows.map((row, i) => (
          <Card key={i} className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Period {i + 1}</span>
              {rows.length > 1 && (
                <button onClick={() => removeRow(i)} className="text-xs text-[var(--color-text-muted)] hover:text-danger">Remove</button>
              )}
            </div>
            <Select
              label="Reported month"
              value={row.report_month}
              onChange={(e) => updateRow(i, 'report_month', e.target.value)}
            >
              {months.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
            </Select>
            <div className="grid grid-cols-3 gap-3">
              <Input
                label="Production ending PG"
                type="number"
                step="0.0001"
                min="0"
                value={row.production_ending_pg}
                onChange={(e) => updateRow(i, 'production_ending_pg', e.target.value)}
                placeholder="0.0000"
              />
              <Input
                label="Storage ending PG"
                type="number"
                step="0.0001"
                min="0"
                value={row.storage_ending_pg}
                onChange={(e) => updateRow(i, 'storage_ending_pg', e.target.value)}
                placeholder="0.0000"
              />
              <Input
                label="Processing ending PG"
                type="number"
                step="0.0001"
                min="0"
                value={row.processing_ending_pg}
                onChange={(e) => updateRow(i, 'processing_ending_pg', e.target.value)}
                placeholder="0.0000"
              />
            </div>
            <Input
              label="Notes (optional)"
              value={row.notes}
              onChange={(e) => updateRow(i, 'notes', e.target.value)}
              placeholder="e.g. From January 2025 paper records"
            />
          </Card>
        ))}
      </div>

      <button onClick={addRow} className="text-sm text-primary hover:underline">+ Add another period</button>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={() => router.push('/compliance')} className="flex-1">Cancel</Button>
        <Button onClick={save} loading={saving} className="flex-1">Import balances</Button>
      </div>

      <p className="text-xs text-[var(--color-text-muted)] text-center">
        These records are marked as "manually imported" and will not replace actual filed data if it already exists for that period.
      </p>
    </div>
  )
}
