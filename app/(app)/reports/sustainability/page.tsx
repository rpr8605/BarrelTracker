'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'

type Summary = {
  water_gallons: number
  energy_kwh: number
  waste_kg: number
  co2e_metric_tons: number
  grain: { local: number; regional: number; commodity: number; unknown: number; total: number }
  pct_local: number
}

export default function SustainabilityPage() {
  const [year, setYear] = useState(new Date().getFullYear())
  const [summary, setSummary] = useState<Summary | null>(null)
  const [monthly, setMonthly] = useState<Record<string, { water: number; energy: number }>>({})
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ log_date: new Date().toISOString().slice(0, 10), water_usage_gallons: '', energy_kwh: '', waste_kg: '', grain_source_type: 'unknown', grain_lbs: '', notes: '' })
  const [generating, setGenerating] = useState(false)

  async function load() {
    const r = await fetch(`/api/sustainability?year=${year}`).then((r) => r.json())
    setSummary(r.summary)
    setMonthly(r.monthly || {})
  }
  useEffect(() => { load() }, [year])

  async function add() {
    await fetch('/api/sustainability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        log_date: form.log_date,
        water_usage_gallons: form.water_usage_gallons ? Number(form.water_usage_gallons) : null,
        energy_kwh: form.energy_kwh ? Number(form.energy_kwh) : null,
        waste_kg: form.waste_kg ? Number(form.waste_kg) : null,
        grain_source_type: form.grain_source_type,
        grain_lbs: form.grain_lbs ? Number(form.grain_lbs) : null,
        notes: form.notes || null,
      }),
    })
    setShowForm(false)
    setForm({ log_date: new Date().toISOString().slice(0, 10), water_usage_gallons: '', energy_kwh: '', waste_kg: '', grain_source_type: 'unknown', grain_lbs: '', notes: '' })
    load()
  }

  async function generatePdf() {
    setGenerating(true)
    const r = await fetch('/api/pdf/sustainability', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ year }) }).then((r) => r.json())
    if (r.pdf_url) window.open(r.pdf_url, '_blank')
    setGenerating(false)
  }

  const maxBar = Math.max(...Object.values(monthly).map((m) => Math.max(m.water, m.energy)), 1)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-medium">Sustainability</h1>
        <div className="flex gap-2">
          <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} className="w-24" />
          <Button variant="secondary" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : 'Log production'}</Button>
          <Button loading={generating} onClick={generatePdf}>PDF report</Button>
        </div>
      </div>

      {showForm && (
        <Card>
          <div className="grid md:grid-cols-3 gap-3">
            <Input label="Date" type="date" value={form.log_date} onChange={(e) => setForm({ ...form, log_date: e.target.value })} />
            <Input label="Water (gal)" type="number" value={form.water_usage_gallons} onChange={(e) => setForm({ ...form, water_usage_gallons: e.target.value })} />
            <Input label="Energy (kWh)" type="number" value={form.energy_kwh} onChange={(e) => setForm({ ...form, energy_kwh: e.target.value })} />
            <Input label="Waste (kg)" type="number" value={form.waste_kg} onChange={(e) => setForm({ ...form, waste_kg: e.target.value })} />
            <Select label="Grain source" value={form.grain_source_type} onChange={(e) => setForm({ ...form, grain_source_type: e.target.value })}>
              <option value="local">Local (&lt; 100 mi)</option>
              <option value="regional">Regional (100–500 mi)</option>
              <option value="commodity">Commodity (500+ mi)</option>
              <option value="unknown">Unknown</option>
            </Select>
            <Input label="Grain lbs" type="number" value={form.grain_lbs} onChange={(e) => setForm({ ...form, grain_lbs: e.target.value })} />
          </div>
          <div className="mt-3"><Button onClick={add}>Save entry</Button></div>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <M label="Water (gal)"   value={summary?.water_gallons.toFixed(0) ?? '—'} />
        <M label="Energy (kWh)"  value={summary?.energy_kwh.toFixed(0) ?? '—'} />
        <M label="CO2e (mt)"     value={summary?.co2e_metric_tons.toFixed(2) ?? '—'} />
        <M label="% Local grain" value={summary ? `${summary.pct_local.toFixed(0)}%` : '—'} />
      </div>

      <Card>
        <div className="text-sm font-medium mb-3">Monthly water + energy</div>
        <div className="space-y-1">
          {Array.from({ length: 12 }).map((_, i) => {
            const key = `${year}-${String(i + 1).padStart(2, '0')}`
            const m = monthly[key] || { water: 0, energy: 0 }
            return (
              <div key={key} className="grid grid-cols-12 items-center gap-2 text-xs">
                <div className="col-span-1 text-[var(--color-text-muted)]">{new Date(`${key}-01`).toLocaleString('en-US', { month: 'short' })}</div>
                <div className="col-span-5 flex items-center gap-2">
                  <div className="h-3 rounded bg-blue-500/60" style={{ width: `${(m.water / maxBar) * 100}%`, minWidth: m.water > 0 ? '2px' : 0 }} />
                  <span className="opacity-70">{m.water.toFixed(0)} gal</span>
                </div>
                <div className="col-span-5 flex items-center gap-2">
                  <div className="h-3 rounded bg-primary/70" style={{ width: `${(m.energy / maxBar) * 100}%`, minWidth: m.energy > 0 ? '2px' : 0 }} />
                  <span className="opacity-70">{m.energy.toFixed(0)} kWh</span>
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

function M({ label, value }: { label: string; value: string }) {
  return <Card><div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{label}</div><div className="text-xl font-medium mt-1">{value}</div></Card>
}
