'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase'
import { getMyDistilleryId } from '@/lib/distillery'
import { TTB_SPIRITS_TYPES } from '@/lib/ttb'

type SubTab = 'mash' | 'fermentation' | 'distillation' | 'transfers'

interface MashBatch { id: string; batch_number: string; mash_date: string; total_grain_lbs: number | null; vessel_id: string | null; notes: string | null }
interface FermLog { id: string; fermentation_vessel: string; start_date: string; end_date: string | null; start_og: number | null; end_fg: number | null; estimated_abv: number | null; status: string; mash_batch_id: string | null }
interface DistLog { id: string; still_id: string; distillation_date: string; spirits_type: string; run_type: string | null; hearts_gallons: number | null; hearts_proof: number | null; spirits_produced_proof_gallons: number | null }
interface Transfer { id: string; from_account: string; to_account: string; transfer_date: string; spirits_type: string; proof_gallons: number; wine_gallons: number | null }

const GRAIN_TYPES = ['Corn','Rye','Malted Barley','Wheat','Oats','Other']
const RUN_TYPES = [{ value: 'stripping', label: 'Stripping run' }, { value: 'spirit', label: 'Spirit run' }, { value: 'single_pass', label: 'Single pass' }]

export default function ProductionPage() {
  const [distilleryId, setDistilleryId] = useState<string | null>(null)
  const [tab, setTab] = useState<SubTab>('mash')
  const [mash, setMash] = useState<MashBatch[]>([])
  const [ferm, setFerm] = useState<FermLog[]>([])
  const [dist, setDist] = useState<DistLog[]>([])
  const [transfers, setTransfers] = useState<Transfer[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  // Mash form
  const [mashForm, setMashForm] = useState({ batch_number: '', mash_date: new Date().toISOString().split('T')[0], grains: [{ grain_type: 'Corn', quantity_lbs: '' }] as { grain_type: string; quantity_lbs: string }[], water_gallons: '', vessel_id: '', notes: '' })
  // Ferm form
  const [fermForm, setFermForm] = useState({ fermentation_vessel: '', start_date: new Date().toISOString().split('T')[0], start_og: '', mash_batch_id: '', notes: '' })
  // Dist form
  const [distForm, setDistForm] = useState({ still_id: '', distillation_date: new Date().toISOString().split('T')[0], spirits_type: 'bourbon', run_type: 'spirit', hearts_gallons: '', hearts_proof: '', low_wines_gallons: '', low_wines_proof: '', fermentation_log_id: '', notes: '' })
  // Transfer form
  const [txForm, setTxForm] = useState({ from_account: 'production', to_account: 'storage', transfer_date: new Date().toISOString().split('T')[0], spirits_type: 'bourbon', proof_gallons: '', wine_gallons: '', notes: '' })

  const load = useCallback(async (did: string) => {
    const [m, f, d, t] = await Promise.all([
      fetch(`/api/production/mash?distillery_id=${did}`).then((r) => r.ok ? r.json() : []),
      fetch(`/api/production/fermentation?distillery_id=${did}`).then((r) => r.ok ? r.json() : []),
      fetch(`/api/production/distillation?distillery_id=${did}`).then((r) => r.ok ? r.json() : []),
      fetch(`/api/production/transfers?distillery_id=${did}`).then((r) => r.ok ? r.json() : []),
    ])
    setMash(m); setFerm(f); setDist(d); setTransfers(t); setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      getMyDistilleryId(supabase, user.id).then((id) => { if (id) { setDistilleryId(id); load(id) } })
    })
  }, [load])

  async function saveMash() {
    if (!distilleryId) return
    setSaving(true); setError('')
    const grains = mashForm.grains.filter((g) => g.quantity_lbs).map((g) => ({ grain_type: g.grain_type, quantity_lbs: parseFloat(g.quantity_lbs) }))
    const res = await fetch('/api/production/mash', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ distillery_id: distilleryId, batch_number: mashForm.batch_number, mash_date: mashForm.mash_date, grains, water_gallons: mashForm.water_gallons ? parseFloat(mashForm.water_gallons) : null, vessel_id: mashForm.vessel_id || null, notes: mashForm.notes || null }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setMash((p) => [data, ...p]); setShowForm(false); setSaving(false)
  }

  async function saveFerm() {
    if (!distilleryId) return
    setSaving(true); setError('')
    const res = await fetch('/api/production/fermentation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ distillery_id: distilleryId, fermentation_vessel: fermForm.fermentation_vessel, start_date: fermForm.start_date, start_og: fermForm.start_og ? parseFloat(fermForm.start_og) : null, mash_batch_id: fermForm.mash_batch_id || null, notes: fermForm.notes || null }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setFerm((p) => [data, ...p]); setShowForm(false); setSaving(false)
  }

  async function saveDist() {
    if (!distilleryId) return
    setSaving(true); setError('')
    const res = await fetch('/api/production/distillation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ distillery_id: distilleryId, still_id: distForm.still_id, distillation_date: distForm.distillation_date, spirits_type: distForm.spirits_type, run_type: distForm.run_type, hearts_gallons: distForm.hearts_gallons ? parseFloat(distForm.hearts_gallons) : null, hearts_proof: distForm.hearts_proof ? parseFloat(distForm.hearts_proof) : null, low_wines_gallons: distForm.low_wines_gallons ? parseFloat(distForm.low_wines_gallons) : null, low_wines_proof: distForm.low_wines_proof ? parseFloat(distForm.low_wines_proof) : null, fermentation_log_id: distForm.fermentation_log_id || null, notes: distForm.notes || null }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setDist((p) => [data, ...p]); setShowForm(false); setSaving(false)
  }

  async function saveTx() {
    if (!distilleryId) return
    setSaving(true); setError('')
    const res = await fetch('/api/production/transfers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ distillery_id: distilleryId, from_account: txForm.from_account, to_account: txForm.to_account, transfer_date: txForm.transfer_date, spirits_type: txForm.spirits_type, proof_gallons: parseFloat(txForm.proof_gallons), wine_gallons: txForm.wine_gallons ? parseFloat(txForm.wine_gallons) : null, notes: txForm.notes || null }) })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setTransfers((p) => [data, ...p]); setShowForm(false); setSaving(false)
  }

  const TABS: { key: SubTab; label: string; count: number }[] = [
    { key: 'mash', label: 'Mash batches', count: mash.length },
    { key: 'fermentation', label: 'Fermentation', count: ferm.length },
    { key: 'distillation', label: 'Distillation', count: dist.length },
    { key: 'transfers', label: 'Transfers', count: transfers.length },
  ]

  const monthPG = dist.filter((d) => d.distillation_date.startsWith(new Date().toISOString().slice(0, 7))).reduce((s, d) => s + (d.spirits_produced_proof_gallons ?? 0), 0)

  if (loading) return <div className="text-sm text-[var(--color-text-muted)] p-4">Loading production records…</div>

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Production Account</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Feeds Form 5110.40 — log every mash, fermentation, distillation, and transfer</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add record'}</Button>
      </div>

      {monthPG > 0 && (
        <Card className="p-3 flex items-center gap-4">
          <div><p className="text-xs text-[var(--color-text-muted)]">This month — proof gallons produced</p><p className="text-lg font-mono font-semibold">{monthPG.toFixed(4)}</p></div>
        </Card>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-secondary)] overflow-x-auto">
        {TABS.map(({ key, label, count }) => (
          <button key={key} onClick={() => { setTab(key); setShowForm(false) }} className={`px-3 py-1.5 text-sm rounded-md transition-all whitespace-nowrap ${tab === key ? 'bg-[var(--color-bg)] shadow-sm' : 'text-[var(--color-text-muted)]'}`}>
            {label} {count > 0 && <span className="ml-1 text-[10px] opacity-60">({count})</span>}
          </button>
        ))}
      </div>

      {/* Mash */}
      {tab === 'mash' && showForm && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium text-sm">New mash batch</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Batch number *" value={mashForm.batch_number} onChange={(e) => setMashForm((f) => ({ ...f, batch_number: e.target.value }))} placeholder="e.g. MB-2026-001" />
            <Input label="Mash date *" type="date" value={mashForm.mash_date} onChange={(e) => setMashForm((f) => ({ ...f, mash_date: e.target.value }))} />
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium">Grain bill</p>
            {mashForm.grains.map((g, i) => (
              <div key={i} className="grid grid-cols-3 gap-2 items-end">
                <Select value={g.grain_type} onChange={(e) => setMashForm((f) => ({ ...f, grains: f.grains.map((x, j) => j === i ? { ...x, grain_type: e.target.value } : x) }))}>
                  {GRAIN_TYPES.map((gt) => <option key={gt} value={gt}>{gt}</option>)}
                </Select>
                <Input type="number" placeholder="lbs" value={g.quantity_lbs} onChange={(e) => setMashForm((f) => ({ ...f, grains: f.grains.map((x, j) => j === i ? { ...x, quantity_lbs: e.target.value } : x) }))} />
                {mashForm.grains.length > 1 && <button onClick={() => setMashForm((f) => ({ ...f, grains: f.grains.filter((_, j) => j !== i) }))} className="text-xs text-danger pb-2">Remove</button>}
              </div>
            ))}
            <button onClick={() => setMashForm((f) => ({ ...f, grains: [...f.grains, { grain_type: 'Corn', quantity_lbs: '' }] }))} className="text-xs text-primary">+ Add grain</button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Water (gallons)" type="number" value={mashForm.water_gallons} onChange={(e) => setMashForm((f) => ({ ...f, water_gallons: e.target.value }))} />
            <Input label="Vessel ID" value={mashForm.vessel_id} onChange={(e) => setMashForm((f) => ({ ...f, vessel_id: e.target.value }))} placeholder="e.g. Mash Tun 1" />
          </div>
          <Input label="Notes" value={mashForm.notes} onChange={(e) => setMashForm((f) => ({ ...f, notes: e.target.value }))} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button onClick={saveMash} loading={saving} disabled={!mashForm.batch_number}>Save mash batch</Button>
        </Card>
      )}
      {tab === 'mash' && (
        <div className="space-y-2">
          {mash.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No mash batches logged.</p>}
          {mash.map((m) => (
            <Card key={m.id} className="flex items-center justify-between gap-3 py-2.5">
              <div><p className="text-sm font-medium">{m.batch_number}</p><p className="text-xs text-[var(--color-text-muted)]">{m.mash_date}{m.vessel_id ? ` · ${m.vessel_id}` : ''}{m.total_grain_lbs ? ` · ${m.total_grain_lbs} lbs grain` : ''}</p></div>
            </Card>
          ))}
        </div>
      )}

      {/* Fermentation */}
      {tab === 'fermentation' && showForm && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium text-sm">New fermentation log</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Vessel ID *" value={fermForm.fermentation_vessel} onChange={(e) => setFermForm((f) => ({ ...f, fermentation_vessel: e.target.value }))} placeholder="e.g. Fermenter 1" />
            <Input label="Start date *" type="date" value={fermForm.start_date} onChange={(e) => setFermForm((f) => ({ ...f, start_date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Original gravity" type="number" step="0.001" value={fermForm.start_og} onChange={(e) => setFermForm((f) => ({ ...f, start_og: e.target.value }))} placeholder="e.g. 1.065" />
            <Select label="Mash batch (optional)" value={fermForm.mash_batch_id} onChange={(e) => setFermForm((f) => ({ ...f, mash_batch_id: e.target.value }))}>
              <option value="">— none —</option>
              {mash.map((m) => <option key={m.id} value={m.id}>{m.batch_number} ({m.mash_date})</option>)}
            </Select>
          </div>
          <Input label="Notes" value={fermForm.notes} onChange={(e) => setFermForm((f) => ({ ...f, notes: e.target.value }))} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button onClick={saveFerm} loading={saving} disabled={!fermForm.fermentation_vessel}>Save fermentation log</Button>
        </Card>
      )}
      {tab === 'fermentation' && (
        <div className="space-y-2">
          {ferm.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No fermentation logs.</p>}
          {ferm.map((f) => (
            <Card key={f.id} className="flex items-center justify-between gap-3 py-2.5">
              <div><p className="text-sm font-medium">{f.fermentation_vessel}</p><p className="text-xs text-[var(--color-text-muted)]">{f.start_date}{f.estimated_abv ? ` · ~${f.estimated_abv}% ABV` : ''} · {f.status}</p></div>
            </Card>
          ))}
        </div>
      )}

      {/* Distillation */}
      {tab === 'distillation' && showForm && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium text-sm">New distillation run</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Still ID *" value={distForm.still_id} onChange={(e) => setDistForm((f) => ({ ...f, still_id: e.target.value }))} placeholder="e.g. Pot Still 1" />
            <Input label="Date *" type="date" value={distForm.distillation_date} onChange={(e) => setDistForm((f) => ({ ...f, distillation_date: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select label="Spirit class" value={distForm.spirits_type} onChange={(e) => setDistForm((f) => ({ ...f, spirits_type: e.target.value }))}>
              {TTB_SPIRITS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
            <Select label="Run type" value={distForm.run_type} onChange={(e) => setDistForm((f) => ({ ...f, run_type: e.target.value }))}>
              {RUN_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Hearts (WG)" type="number" step="0.0001" value={distForm.hearts_gallons} onChange={(e) => setDistForm((f) => ({ ...f, hearts_gallons: e.target.value }))} />
            <Input label="Hearts proof" type="number" step="0.001" value={distForm.hearts_proof} onChange={(e) => setDistForm((f) => ({ ...f, hearts_proof: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Low wines (WG)" type="number" step="0.0001" value={distForm.low_wines_gallons} onChange={(e) => setDistForm((f) => ({ ...f, low_wines_gallons: e.target.value }))} />
            <Input label="Low wines proof" type="number" step="0.001" value={distForm.low_wines_proof} onChange={(e) => setDistForm((f) => ({ ...f, low_wines_proof: e.target.value }))} />
          </div>
          {distForm.hearts_gallons && distForm.hearts_proof && (
            <p className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] rounded p-2">
              Proof gallons: {(parseFloat(distForm.hearts_gallons) * parseFloat(distForm.hearts_proof) / 100 + (parseFloat(distForm.low_wines_gallons || '0') * parseFloat(distForm.low_wines_proof || '0') / 100)).toFixed(4)} PG
            </p>
          )}
          <Select label="Fermentation log (optional)" value={distForm.fermentation_log_id} onChange={(e) => setDistForm((f) => ({ ...f, fermentation_log_id: e.target.value }))}>
            <option value="">— none —</option>
            {ferm.map((f) => <option key={f.id} value={f.id}>{f.fermentation_vessel} ({f.start_date})</option>)}
          </Select>
          <Input label="Notes" value={distForm.notes} onChange={(e) => setDistForm((f) => ({ ...f, notes: e.target.value }))} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button onClick={saveDist} loading={saving} disabled={!distForm.still_id}>Save distillation run</Button>
        </Card>
      )}
      {tab === 'distillation' && (
        <div className="space-y-2">
          {dist.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No distillation runs logged.</p>}
          {dist.map((d) => (
            <Card key={d.id} className="flex items-center justify-between gap-3 py-2.5">
              <div><p className="text-sm font-medium">{d.still_id} — {d.run_type ?? 'run'}</p><p className="text-xs text-[var(--color-text-muted)]">{d.distillation_date} · {d.spirits_type}</p></div>
              <div className="text-right"><p className="text-sm font-mono font-semibold">{d.spirits_produced_proof_gallons?.toFixed(4)} PG</p></div>
            </Card>
          ))}
        </div>
      )}

      {/* Transfers */}
      {tab === 'transfers' && showForm && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium text-sm">Account transfer</h3>
          <div className="grid grid-cols-2 gap-3">
            <Select label="From account" value={txForm.from_account} onChange={(e) => setTxForm((f) => ({ ...f, from_account: e.target.value }))}>
              <option value="production">Production</option>
              <option value="storage">Storage</option>
              <option value="processing">Processing</option>
            </Select>
            <Select label="To account" value={txForm.to_account} onChange={(e) => setTxForm((f) => ({ ...f, to_account: e.target.value }))}>
              <option value="storage">Storage</option>
              <option value="processing">Processing</option>
              <option value="taxpaid">Tax paid (removal)</option>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Transfer date *" type="date" value={txForm.transfer_date} onChange={(e) => setTxForm((f) => ({ ...f, transfer_date: e.target.value }))} />
            <Select label="Spirit class" value={txForm.spirits_type} onChange={(e) => setTxForm((f) => ({ ...f, spirits_type: e.target.value }))}>
              {TTB_SPIRITS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Proof gallons *" type="number" step="0.0001" value={txForm.proof_gallons} onChange={(e) => setTxForm((f) => ({ ...f, proof_gallons: e.target.value }))} />
            <Input label="Wine gallons" type="number" step="0.0001" value={txForm.wine_gallons} onChange={(e) => setTxForm((f) => ({ ...f, wine_gallons: e.target.value }))} />
          </div>
          <Input label="Notes" value={txForm.notes} onChange={(e) => setTxForm((f) => ({ ...f, notes: e.target.value }))} />
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button onClick={saveTx} loading={saving} disabled={!txForm.proof_gallons}>Save transfer</Button>
        </Card>
      )}
      {tab === 'transfers' && (
        <div className="space-y-2">
          {transfers.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No transfers logged.</p>}
          {transfers.map((t) => (
            <Card key={t.id} className="flex items-center justify-between gap-3 py-2.5">
              <div><p className="text-sm font-medium">{t.from_account} → {t.to_account}</p><p className="text-xs text-[var(--color-text-muted)]">{t.transfer_date} · {t.spirits_type}</p></div>
              <p className="text-sm font-mono">{t.proof_gallons.toFixed(4)} PG</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
