'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { CBMAMeter } from '@/components/tax/CBMAMeter'
import { createClient } from '@/lib/supabase'
import { getMyDistilleryId } from '@/lib/distillery'
import { getYearTaxPeriods } from '@/lib/ttb/tax-periods'
import type { CBMAStatus } from '@/lib/ttb/cbma-calculator'

interface Removal { id: string; removal_date: string; product_name: string; destination: string; cases_removed: number; proof_gallons: number; tax_owed: number; cbma_rate_applied: number; tax_period: string }
interface DashData { cbma_status: CBMAStatus; ytd_proof_gallons: number; ytd_total_tax: number; monthly_breakdown: { month: string; proof_gallons: number; tax_owed: number }[]; current_period: { period_key: string; label: string; due_date_str: string; proof_gallons: number; tax_owed: number }; prior_period: { period_key: string; label: string; due_date_str: string; proof_gallons: number; tax_owed: number } }

const DESTINATIONS = ['distributor','retailer','tasting_room','gift_shop','export','other']
const BOTTLE_SIZES = [50, 200, 375, 750, 1000, 1750]

export default function TaxPage() {
  const [distilleryId, setDistilleryId] = useState<string | null>(null)
  const [dash, setDash] = useState<DashData | null>(null)
  const [removals, setRemovals] = useState<Removal[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'removals' | 'calendar'>('overview')

  const [form, setForm] = useState({
    removal_date: new Date().toISOString().split('T')[0],
    product_name: '',
    spirits_type: 'bourbon',
    destination: 'distributor',
    cases_removed: '',
    bottles_per_case: '12',
    bottle_size_ml: '750',
    proof: '',
    notes: '',
  })
  function setF(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })) }

  const load = useCallback(async (did: string) => {
    const [d, r] = await Promise.all([
      fetch(`/api/tax/dashboard?distillery_id=${did}`).then((x) => x.ok ? x.json() : null),
      fetch(`/api/tax/removals?distillery_id=${did}`).then((x) => x.ok ? x.json() : []),
    ])
    setDash(d)
    setRemovals(r)
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      getMyDistilleryId(supabase, user.id).then((id) => {
        if (!id) return
        setDistilleryId(id)
        load(id)
      })
    })
  }, [load])

  async function saveRemoval() {
    if (!distilleryId) return
    setSaving(true); setError('')
    const res = await fetch('/api/tax/removals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        distillery_id: distilleryId,
        ...form,
        cases_removed: parseInt(form.cases_removed),
        bottles_per_case: parseInt(form.bottles_per_case),
        bottle_size_ml: parseFloat(form.bottle_size_ml),
        proof: parseFloat(form.proof),
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setRemovals((r) => [data, ...r])
    setShowForm(false)
    setSaving(false)
    load(distilleryId)
  }

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const fmtPG = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })

  if (loading) return <div className="text-sm text-[var(--color-text-muted)] p-4">Loading tax records…</div>

  const periods = getYearTaxPeriods(new Date().getFullYear())
  const removalsByPeriod: Record<string, Removal[]> = {}
  for (const r of removals) {
    if (!removalsByPeriod[r.tax_period]) removalsByPeriod[r.tax_period] = []
    removalsByPeriod[r.tax_period].push(r)
  }

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Excise Tax</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Federal excise tax tracking — semi-monthly filing (27 CFR 19.235)</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">{showForm ? 'Cancel' : '+ Log removal'}</Button>
      </div>

      {/* Quick-add form */}
      {showForm && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium text-sm">Log tax-determined removal</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Removal date" type="date" value={form.removal_date} onChange={(e) => setF('removal_date', e.target.value)} />
            <Input label="Product name" value={form.product_name} onChange={(e) => setF('product_name', e.target.value)} placeholder="e.g. Straight Bourbon Batch 12" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Destination" value={form.destination} onChange={(e) => setF('destination', e.target.value)}>
              {DESTINATIONS.map((d) => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
            </Select>
            <Select label="Proof" value={form.proof} onChange={(e) => setF('proof', e.target.value)}>
              <option value="">Enter below</option>
            </Select>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Input label="Cases" type="number" min="1" value={form.cases_removed} onChange={(e) => setF('cases_removed', e.target.value)} placeholder="0" />
            <Input label="Bottles/case" type="number" min="1" value={form.bottles_per_case} onChange={(e) => setF('bottles_per_case', e.target.value)} />
            <Select label="Bottle size (mL)" value={form.bottle_size_ml} onChange={(e) => setF('bottle_size_ml', e.target.value)}>
              {BOTTLE_SIZES.map((s) => <option key={s} value={s}>{s}mL</option>)}
            </Select>
            <Input label="Proof" type="number" min="0" max="200" step="0.001" value={form.proof} onChange={(e) => setF('proof', e.target.value)} placeholder="e.g. 90" />
          </div>
          {form.cases_removed && form.proof && form.bottle_size_ml && (
            <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] rounded p-2">
              Preview: {(parseInt(form.cases_removed) * parseInt(form.bottles_per_case) * parseFloat(form.bottle_size_ml) / 3785.41 * parseFloat(form.proof) / 100).toFixed(4)} PG
              {' '}· Est. tax: ${(parseInt(form.cases_removed) * parseInt(form.bottles_per_case) * parseFloat(form.bottle_size_ml) / 3785.41 * parseFloat(form.proof) / 100 * (dash?.cbma_status.current_rate ?? 2.70)).toFixed(2)} at ${dash?.cbma_status.current_rate ?? 2.70}/PG
            </div>
          )}
          {['tasting_room','gift_shop'].includes(form.destination) && (
            <p className="text-xs text-amber-400">Reminder: internal tasting room and gift shop moves trigger FET (27 CFR 19.221).</p>
          )}
          <Input label="Notes (optional)" value={form.notes} onChange={(e) => setF('notes', e.target.value)} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button onClick={saveRemoval} loading={saving} disabled={!form.cases_removed || !form.proof || !form.product_name}>Log removal</Button>
        </Card>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-secondary)] overflow-x-auto">
        {(['overview','removals','calendar'] as const).map((t) => (
          <button key={t} onClick={() => setActiveTab(t)} className={`px-3 py-1.5 text-sm rounded-md transition-all whitespace-nowrap ${activeTab === t ? 'bg-[var(--color-bg)] shadow-sm' : 'text-[var(--color-text-muted)]'}`}>
            {t === 'overview' ? 'Overview' : t === 'removals' ? 'Removals' : 'Filing calendar'}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === 'overview' && dash && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'YTD proof gallons', value: fmtPG(dash.ytd_proof_gallons) },
              { label: 'YTD tax owed', value: `$${fmt(dash.ytd_total_tax)}` },
              { label: `Current period tax`, value: `$${fmt(dash.current_period.tax_owed ?? 0)}` },
              { label: 'Prior period tax', value: `$${fmt(dash.prior_period.tax_owed ?? 0)}` },
            ].map(({ label, value }) => (
              <Card key={label} className="p-3">
                <p className="text-xs text-[var(--color-text-muted)]">{label}</p>
                <p className="text-lg font-semibold font-mono mt-1">{value}</p>
              </Card>
            ))}
          </div>

          <Card className="p-4">
            <p className="text-sm font-medium mb-3">CBMA threshold progress</p>
            <CBMAMeter status={dash.cbma_status} />
          </Card>

          <div className="grid sm:grid-cols-2 gap-3">
            <Card className="p-4 space-y-2">
              <p className="text-sm font-medium">Current period — {dash.current_period.label}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Due {dash.current_period.due_date_str}</p>
              <p className="text-2xl font-mono font-semibold">${fmt(dash.current_period.tax_owed ?? 0)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{fmtPG(dash.current_period.proof_gallons ?? 0)} PG</p>
            </Card>
            <Card className="p-4 space-y-2">
              <p className="text-sm font-medium">Prior period — {dash.prior_period.label}</p>
              <p className="text-xs text-[var(--color-text-muted)]">Due {dash.prior_period.due_date_str}</p>
              <p className="text-2xl font-mono font-semibold">${fmt(dash.prior_period.tax_owed ?? 0)}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{fmtPG(dash.prior_period.proof_gallons ?? 0)} PG</p>
            </Card>
          </div>

          {dash.monthly_breakdown.length > 0 && (
            <Card className="p-4">
              <p className="text-sm font-medium mb-3">Monthly FET — {new Date().getFullYear()}</p>
              <div className="space-y-2">
                {dash.monthly_breakdown.map((m) => {
                  const maxTax = Math.max(...dash.monthly_breakdown.map((x) => x.tax_owed), 1)
                  return (
                    <div key={m.month} className="flex items-center gap-3">
                      <span className="text-xs text-[var(--color-text-muted)] w-16 shrink-0">{new Date(m.month + '-01').toLocaleDateString('en-US', { month: 'short' })}</span>
                      <div className="flex-1 bg-[var(--color-bg-secondary)] rounded h-5 overflow-hidden">
                        <div className="h-full bg-primary rounded" style={{ width: `${(m.tax_owed / maxTax) * 100}%` }} />
                      </div>
                      <span className="text-xs font-mono w-20 text-right">${fmt(m.tax_owed)}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Removals list */}
      {activeTab === 'removals' && (
        <div className="space-y-2">
          {removals.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No removals logged yet.</p>}
          {removals.map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.product_name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{r.removal_date} · {r.cases_removed} cases · {r.destination.replace(/_/g, ' ')} · ${r.cbma_rate_applied}/PG</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-mono font-semibold">${fmt(r.tax_owed)}</p>
                <p className="text-xs text-[var(--color-text-muted)] font-mono">{fmtPG(r.proof_gallons)} PG</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Filing calendar */}
      {activeTab === 'calendar' && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--color-text-muted)]">Semi-monthly FET filing periods for {new Date().getFullYear()}. Payments due via Pay.gov by 8:55 PM ET the business day before the due date.</p>
          {periods.map((p) => {
            const now = new Date()
            const isPast = p.due_date < now
            const isUpcoming = !isPast && p.due_date.getTime() - now.getTime() < 14 * 86_400_000
            const periodRemovals = removalsByPeriod[p.period_key] ?? []
            const periodTax = periodRemovals.reduce((s, r) => s + r.tax_owed, 0)
            return (
              <Card key={p.period_key} className={`flex items-center justify-between gap-3 py-2.5 ${isUpcoming ? 'border-amber-500/30' : ''}`}>
                <div className="min-w-0">
                  <p className="text-sm font-medium">{p.label}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{p.start_date} – {p.end_date} · Due {p.due_date_str}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {periodRemovals.length > 0 && <span className="text-xs font-mono">${fmt(periodTax)}</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${isPast && periodRemovals.length === 0 ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]' : isPast ? 'bg-green-500/10 text-green-400' : isUpcoming ? 'bg-amber-500/10 text-amber-400' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]'}`}>
                    {isPast && periodRemovals.length === 0 ? 'No activity' : isPast ? 'Past' : isUpcoming ? 'Due soon' : 'Upcoming'}
                  </span>
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
