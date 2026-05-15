'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type Line = {
  barrel_id: string
  barrel_number: string
  spirit_type: string
  fill_date: string | null
  age_months: number
  gallons: number
  rate_per_gallon: number
  estimated_value: number
}
type Preview = { lines: Line[]; total_value: number; total_gallons: number; barrel_count: number; avg_age: number }
type Snapshot = { id: string; generated_at: string; total_value: number; barrel_count: number; total_gallons: number; pdf_url: string | null }

function fmt(n: number) { return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n) }

export default function ValuationPage() {
  const [preview, setPreview] = useState<Preview | null>(null)
  const [snapshots, setSnapshots] = useState<Snapshot[]>([])
  const [generating, setGenerating] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function load() {
    const p = await fetch('/api/valuation/preview').then((r) => r.json())
    setPreview(p)
    const s = await fetch('/api/valuation/snapshots').then((r) => r.json()).catch(() => ({ snapshots: [] }))
    setSnapshots(s.snapshots || [])
  }
  useEffect(() => { load() }, [])

  async function generate() {
    setGenerating(true); setErr(null)
    try {
      const r = await fetch('/api/pdf/valuation', { method: 'POST' }).then((r) => r.json())
      if (r.error) throw new Error(r.error)
      if (r.pdf_url) window.open(r.pdf_url, '_blank')
      await load()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-medium">Valuation Report</h1>
        <Button loading={generating} onClick={generate}>Generate PDF report</Button>
      </div>
      {err && <div className="text-sm text-danger">{err}</div>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Metric label="Total value" value={preview ? fmt(preview.total_value) : '—'} />
        <Metric label="Barrels"     value={preview ? String(preview.barrel_count) : '—'} />
        <Metric label="Avg age"     value={preview ? `${(preview.avg_age / 12).toFixed(1)}yr` : '—'} />
        <Metric label="Total gal"   value={preview ? preview.total_gallons.toFixed(0) : '—'} />
      </div>

      <Card>
        <div className="text-sm font-medium mb-3">Per-barrel breakdown</div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="py-2">Barrel</th><th>Spirit</th><th>Fill</th><th className="text-right">Age (mo)</th><th className="text-right">Gal</th><th className="text-right">Rate</th><th className="text-right">Value</th>
              </tr>
            </thead>
            <tbody>
              {preview?.lines.map((l) => (
                <tr key={l.barrel_id} className="border-b border-[var(--color-border)]/40">
                  <td className="py-1">{l.barrel_number}</td>
                  <td>{l.spirit_type}</td>
                  <td>{l.fill_date || '—'}</td>
                  <td className="text-right">{l.age_months}</td>
                  <td className="text-right">{l.gallons.toFixed(1)}</td>
                  <td className="text-right">${l.rate_per_gallon.toFixed(2)}</td>
                  <td className="text-right font-medium">{fmt(l.estimated_value)}</td>
                </tr>
              ))}
              {preview?.lines.length === 0 && (
                <tr><td colSpan={7} className="text-center py-6 text-[var(--color-text-muted)]">No active barrels.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {snapshots.length > 0 && (
        <Card>
          <div className="text-sm font-medium mb-3">Past snapshots</div>
          <div className="space-y-2">
            {snapshots.map((s) => (
              <div key={s.id} className="flex items-center justify-between p-2 rounded border border-[var(--color-border)]">
                <div className="text-sm">
                  <div className="font-medium">{new Date(s.generated_at).toLocaleString()}</div>
                  <div className="text-xs text-[var(--color-text-muted)]">{s.barrel_count} barrels · {s.total_gallons.toFixed(0)}gal · {fmt(s.total_value)}</div>
                </div>
                {s.pdf_url && <a href={s.pdf_url} target="_blank" rel="noreferrer" className="text-primary text-xs">Download PDF →</a>}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <div className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">{label}</div>
      <div className="text-xl font-medium mt-1">{value}</div>
    </Card>
  )
}
