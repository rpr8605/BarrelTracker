'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase'
import { getMyDistilleryId } from '@/lib/distillery'

interface BottlingRecord {
  id: string; bottling_date: string; product_name: string; spirits_type: string
  bottle_size_ml: number; bottles_per_case: number; cases_bottled: number
  proof: number; wine_gallons: number; proof_gallons: number; lot_number?: string; notes?: string
}
interface RemnantRecord {
  id: string; log_date: string; product_name: string; bottles_count: number
  estimated_proof_gallons: number; disposition: string; notes?: string
}
interface LeakerRecord {
  id: string; log_date: string; product_name: string; leakers_count: number
  estimated_proof_gallons_lost: number; disposition: string; destruction_witnessed_by?: string; notes?: string
}

const BOTTLE_SIZES = [50, 200, 375, 750, 1000, 1750]
const SPIRITS_TYPES = ['bourbon','rye','wheat_whiskey','malt_whiskey','corn_whiskey','light_whiskey','spirit_whiskey','vodka','gin','rum','brandy','other']
const REMNANT_DISPS = ['on_hand','destroyed','returned_to_processing','other']
const LEAKER_DISPS = ['destroyed','returned_to_processing','other']

export default function ProcessingPage() {
  const [distilleryId, setDistilleryId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'bottling' | 'remnant' | 'leakers'>('bottling')
  const [bottling, setBottling] = useState<BottlingRecord[]>([])
  const [remnants, setRemnants] = useState<RemnantRecord[]>([])
  const [leakers, setLeakers] = useState<LeakerRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const [bottlingForm, setBottlingForm] = useState({
    bottling_date: today, product_name: '', spirits_type: 'bourbon',
    bottle_size_ml: '750', bottles_per_case: '12', cases_bottled: '',
    proof: '', lot_number: '', notes: '',
  })
  const [remnantForm, setRemnantForm] = useState({
    log_date: today, product_name: '', bottles_count: '',
    estimated_proof_gallons: '', disposition: 'on_hand', notes: '',
  })
  const [leakerForm, setLeakerForm] = useState({
    log_date: today, product_name: '', leakers_count: '',
    estimated_proof_gallons_lost: '', disposition: 'destroyed',
    destruction_witnessed_by: '', notes: '',
  })

  const setBF = (k: string, v: string) => setBottlingForm((f) => ({ ...f, [k]: v }))
  const setRF = (k: string, v: string) => setRemnantForm((f) => ({ ...f, [k]: v }))
  const setLF = (k: string, v: string) => setLeakerForm((f) => ({ ...f, [k]: v }))

  const load = useCallback(async (did: string) => {
    const [b, r, l] = await Promise.all([
      fetch(`/api/processing/bottling?distillery_id=${did}`).then((x) => x.ok ? x.json() : []),
      fetch(`/api/processing/remnant?distillery_id=${did}`).then((x) => x.ok ? x.json() : []),
      fetch(`/api/processing/leakers?distillery_id=${did}`).then((x) => x.ok ? x.json() : []),
    ])
    setBottling(b)
    setRemnants(r)
    setLeakers(l)
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

  async function saveBottling() {
    if (!distilleryId) return
    setSaving(true); setError('')
    const res = await fetch('/api/processing/bottling', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        distillery_id: distilleryId,
        ...bottlingForm,
        bottle_size_ml: parseFloat(bottlingForm.bottle_size_ml),
        bottles_per_case: parseInt(bottlingForm.bottles_per_case),
        cases_bottled: parseInt(bottlingForm.cases_bottled),
        proof: parseFloat(bottlingForm.proof),
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setBottling((b) => [data, ...b])
    setShowForm(false); setSaving(false)
  }

  async function saveRemnant() {
    if (!distilleryId) return
    setSaving(true); setError('')
    const res = await fetch('/api/processing/remnant', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        distillery_id: distilleryId,
        ...remnantForm,
        bottles_count: parseInt(remnantForm.bottles_count),
        estimated_proof_gallons: remnantForm.estimated_proof_gallons ? parseFloat(remnantForm.estimated_proof_gallons) : null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setRemnants((r) => [data, ...r])
    setShowForm(false); setSaving(false)
  }

  async function saveLeaker() {
    if (!distilleryId) return
    setSaving(true); setError('')
    const res = await fetch('/api/processing/leakers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        distillery_id: distilleryId,
        ...leakerForm,
        leakers_count: parseInt(leakerForm.leakers_count),
        estimated_proof_gallons_lost: leakerForm.estimated_proof_gallons_lost ? parseFloat(leakerForm.estimated_proof_gallons_lost) : null,
      }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setLeakers((l) => [data, ...l])
    setShowForm(false); setSaving(false)
  }

  const fmtPG = (n: number) => n?.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 }) ?? '—'

  // Month-to-date proof gallons bottled
  const thisMonth = new Date().toISOString().slice(0, 7)
  const mtdPG = bottling.filter((b) => b.bottling_date.startsWith(thisMonth)).reduce((s, b) => s + (b.proof_gallons ?? 0), 0)
  const mtdCases = bottling.filter((b) => b.bottling_date.startsWith(thisMonth)).reduce((s, b) => s + b.cases_bottled, 0)

  // Proof gallon preview for bottling form
  const pgPreview = bottlingForm.cases_bottled && bottlingForm.proof && bottlingForm.bottle_size_ml
    ? (parseInt(bottlingForm.cases_bottled) * parseInt(bottlingForm.bottles_per_case) * parseFloat(bottlingForm.bottle_size_ml) / 3785.41 * parseFloat(bottlingForm.proof) / 100)
    : null

  if (loading) return <div className="text-sm text-[var(--color-text-muted)] p-4">Loading processing records…</div>

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Processing Account</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Bottling, remnant area, and leaker records — 27 CFR 19.520</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setError('') }} size="sm">{showForm ? 'Cancel' : `+ Log ${activeTab === 'bottling' ? 'bottling run' : activeTab === 'remnant' ? 'remnant' : 'leaker'}`}</Button>
      </div>

      {/* MTD summary */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Card className="p-3">
          <p className="text-xs text-[var(--color-text-muted)]">MTD proof gallons bottled</p>
          <p className="text-lg font-semibold font-mono mt-1">{fmtPG(mtdPG)}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-[var(--color-text-muted)]">MTD cases bottled</p>
          <p className="text-lg font-semibold font-mono mt-1">{mtdCases.toLocaleString()}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-[var(--color-text-muted)]">Remnant / leaker records</p>
          <p className="text-lg font-semibold font-mono mt-1">{remnants.length + leakers.length}</p>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-secondary)] overflow-x-auto">
        {(['bottling', 'remnant', 'leakers'] as const).map((t) => (
          <button key={t} onClick={() => { setActiveTab(t); setShowForm(false); setError('') }}
            className={`px-3 py-1.5 text-sm rounded-md transition-all whitespace-nowrap ${activeTab === t ? 'bg-[var(--color-bg)] shadow-sm' : 'text-[var(--color-text-muted)]'}`}>
            {t === 'bottling' ? 'Bottling' : t === 'remnant' ? 'Remnant area' : 'Leakers'}
          </button>
        ))}
      </div>

      {/* Forms */}
      {showForm && activeTab === 'bottling' && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium text-sm">Log bottling run</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Bottling date" type="date" value={bottlingForm.bottling_date} onChange={(e) => setBF('bottling_date', e.target.value)} />
            <Input label="Product name" value={bottlingForm.product_name} onChange={(e) => setBF('product_name', e.target.value)} placeholder="e.g. Straight Bourbon Batch 12" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Spirits type" value={bottlingForm.spirits_type} onChange={(e) => setBF('spirits_type', e.target.value)}>
              {SPIRITS_TYPES.map((t) => <option key={t} value={t}>{t.replace(/_/g, ' ')}</option>)}
            </Select>
            <Input label="Lot number (optional)" value={bottlingForm.lot_number} onChange={(e) => setBF('lot_number', e.target.value)} placeholder="e.g. L2026-01" />
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Input label="Cases" type="number" min="1" value={bottlingForm.cases_bottled} onChange={(e) => setBF('cases_bottled', e.target.value)} placeholder="0" />
            <Input label="Bottles/case" type="number" min="1" value={bottlingForm.bottles_per_case} onChange={(e) => setBF('bottles_per_case', e.target.value)} />
            <Select label="Bottle size (mL)" value={bottlingForm.bottle_size_ml} onChange={(e) => setBF('bottle_size_ml', e.target.value)}>
              {BOTTLE_SIZES.map((s) => <option key={s} value={s}>{s}mL</option>)}
            </Select>
            <Input label="Proof" type="number" min="0" max="200" step="0.001" value={bottlingForm.proof} onChange={(e) => setBF('proof', e.target.value)} placeholder="e.g. 90" />
          </div>
          {pgPreview !== null && (
            <div className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] rounded p-2">
              {(parseInt(bottlingForm.cases_bottled) * parseInt(bottlingForm.bottles_per_case)).toLocaleString()} bottles · {fmtPG(pgPreview)} proof gallons · {(parseInt(bottlingForm.cases_bottled) * parseInt(bottlingForm.bottles_per_case) * parseFloat(bottlingForm.bottle_size_ml) / 3785.41).toFixed(4)} wine gallons
            </div>
          )}
          <Input label="Notes (optional)" value={bottlingForm.notes} onChange={(e) => setBF('notes', e.target.value)} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button onClick={saveBottling} loading={saving} disabled={!bottlingForm.cases_bottled || !bottlingForm.proof || !bottlingForm.product_name}>Save bottling run</Button>
        </Card>
      )}

      {showForm && activeTab === 'remnant' && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium text-sm">Log remnant area entry</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Remnants are bottles that cannot be sold and are held pending disposition — 27 CFR 19.460</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={remnantForm.log_date} onChange={(e) => setRF('log_date', e.target.value)} />
            <Input label="Product name" value={remnantForm.product_name} onChange={(e) => setRF('product_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Bottle count" type="number" min="1" value={remnantForm.bottles_count} onChange={(e) => setRF('bottles_count', e.target.value)} />
            <Input label="Est. proof gallons" type="number" step="0.0001" value={remnantForm.estimated_proof_gallons} onChange={(e) => setRF('estimated_proof_gallons', e.target.value)} placeholder="Optional" />
            <Select label="Disposition" value={remnantForm.disposition} onChange={(e) => setRF('disposition', e.target.value)}>
              {REMNANT_DISPS.map((d) => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
            </Select>
          </div>
          <Input label="Notes (optional)" value={remnantForm.notes} onChange={(e) => setRF('notes', e.target.value)} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button onClick={saveRemnant} loading={saving} disabled={!remnantForm.bottles_count || !remnantForm.product_name}>Save remnant entry</Button>
        </Card>
      )}

      {showForm && activeTab === 'leakers' && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium text-sm">Log leaker area entry</h3>
          <p className="text-xs text-[var(--color-text-muted)]">Leakers are defective bottles that have lost spirit — record loss for 5110.28 line 7</p>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Date" type="date" value={leakerForm.log_date} onChange={(e) => setLF('log_date', e.target.value)} />
            <Input label="Product name" value={leakerForm.product_name} onChange={(e) => setLF('product_name', e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input label="Leaker count" type="number" min="1" value={leakerForm.leakers_count} onChange={(e) => setLF('leakers_count', e.target.value)} />
            <Input label="Est. PG lost" type="number" step="0.0001" value={leakerForm.estimated_proof_gallons_lost} onChange={(e) => setLF('estimated_proof_gallons_lost', e.target.value)} placeholder="Optional" />
            <Select label="Disposition" value={leakerForm.disposition} onChange={(e) => setLF('disposition', e.target.value)}>
              {LEAKER_DISPS.map((d) => <option key={d} value={d}>{d.replace(/_/g, ' ')}</option>)}
            </Select>
          </div>
          <Input label="Destruction witnessed by (optional)" value={leakerForm.destruction_witnessed_by} onChange={(e) => setLF('destruction_witnessed_by', e.target.value)} placeholder="Name + title" />
          <Input label="Notes (optional)" value={leakerForm.notes} onChange={(e) => setLF('notes', e.target.value)} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button onClick={saveLeaker} loading={saving} disabled={!leakerForm.leakers_count || !leakerForm.product_name}>Save leaker entry</Button>
        </Card>
      )}

      {/* Bottling list */}
      {activeTab === 'bottling' && (
        <div className="space-y-2">
          {bottling.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No bottling runs logged yet.</p>}
          {bottling.map((b) => (
            <Card key={b.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{b.product_name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {b.bottling_date} · {b.cases_bottled} cases × {b.bottles_per_case}ct {b.bottle_size_ml}mL · {b.proof}° proof
                  {b.lot_number ? ` · Lot ${b.lot_number}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-mono font-semibold">{fmtPG(b.proof_gallons)} PG</p>
                <p className="text-xs text-[var(--color-text-muted)] font-mono">{(b.wine_gallons ?? 0).toFixed(4)} WG</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Remnant list */}
      {activeTab === 'remnant' && (
        <div className="space-y-2">
          {remnants.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No remnant area entries logged yet.</p>}
          {remnants.map((r) => (
            <Card key={r.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{r.product_name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">{r.log_date} · {r.bottles_count} bottles · {r.disposition.replace(/_/g, ' ')}</p>
              </div>
              <div className="text-right shrink-0">
                {r.estimated_proof_gallons ? (
                  <p className="text-sm font-mono">{fmtPG(r.estimated_proof_gallons)} PG</p>
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)]">PG not logged</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Leakers list */}
      {activeTab === 'leakers' && (
        <div className="space-y-2">
          {leakers.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No leaker area entries logged yet.</p>}
          {leakers.map((l) => (
            <Card key={l.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{l.product_name}</p>
                <p className="text-xs text-[var(--color-text-muted)]">
                  {l.log_date} · {l.leakers_count} leakers · {l.disposition.replace(/_/g, ' ')}
                  {l.destruction_witnessed_by ? ` · Witnessed: ${l.destruction_witnessed_by}` : ''}
                </p>
              </div>
              <div className="text-right shrink-0">
                {l.estimated_proof_gallons_lost ? (
                  <p className="text-sm font-mono text-danger">{fmtPG(l.estimated_proof_gallons_lost)} PG lost</p>
                ) : (
                  <p className="text-xs text-[var(--color-text-muted)]">PG not logged</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
