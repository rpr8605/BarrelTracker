'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase'
import { getMyDistilleryId } from '@/lib/distillery'
import {
  TTB_SPIRITS_TYPES, COOPERAGE_CODES,
  GAUGE_TYPE_LABELS, PRODUCTION_LOG_LABELS, PROCESSING_LOG_LABELS,
  formatWineGal, formatProofGal, spiritsLabel, calcProofGallons,
  FET_RATE_REDUCED, FET_CBMA_THRESHOLD, daysUntilDue,
} from '@/lib/ttb'
import { formatDate } from '@/lib/utils'
import { OverdueBanner } from '@/components/compliance/OverdueBanner'
import type { ComplianceSnapshot, TtbReport, GaugeRecord, ProductionLog, ProcessingLog, InventoryAttestation } from '@/types/database'

// ─── helpers ──────────────────────────────────────────────────────────────────
function getMonths(count = 12) {
  const out = []
  const now = new Date()
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    out.push({ date: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) })
  }
  return out
}

function TabBtn({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`px-3 py-1.5 text-sm rounded-md transition-all whitespace-nowrap ${active ? 'bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}`}>
      {label}
    </button>
  )
}

function PillBadge({ label, color }: { label: string; color: 'green' | 'amber' | 'red' | 'gray' }) {
  const cls = { green: 'bg-green-500/10 text-green-400', amber: 'bg-amber-500/10 text-amber-400', red: 'bg-red-500/10 text-red-400', gray: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]' }[color]
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${cls}`}>{label}</span>
}

// ─── Main page ─────────────────────────────────────────────────────────────────
type Tab = 'overview' | 'gauge' | 'production' | 'processing' | 'inventory' | 'forms' | 'snapshots'

export default function CompliancePage() {
  const [tab, setTab] = useState<Tab>('overview')
  const [distilleryId, setDistilleryId] = useState<string | null>(null)
  const [dspNumber, setDspNumber] = useState<string>('')
  const [distilleryName, setDistilleryName] = useState<string>('')

  const [snapshots, setSnapshots] = useState<ComplianceSnapshot[]>([])
  const [reports, setReports] = useState<TtbReport[]>([])
  const [gaugeRecords, setGaugeRecords] = useState<GaugeRecord[]>([])
  const [productionLogs, setProductionLogs] = useState<ProductionLog[]>([])
  const [processingLogs, setProcessingLogs] = useState<ProcessingLog[]>([])
  const [attestations, setAttestations] = useState<InventoryAttestation[]>([])

  const [reconciling, setReconciling] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [formData, setFormData] = useState<Record<string, unknown> | null>(null)
  const [formLoading, setFormLoading] = useState(false)
  const [selectedPeriod, setSelectedPeriod] = useState(getMonths(1)[0].date)
  const [selectedFormType, setSelectedFormType] = useState('5110-11')

  const months = getMonths()

  const [showImportBanner, setShowImportBanner] = useState(false)

  const load = useCallback(async (id: string) => {
    const [snaps, gaugRes, prodRes, procRes, attRes, rptRes, histRes] = await Promise.all([
      fetch(`/api/compliance/snapshots?distillery_id=${id}`).then((r) => r.json()),
      fetch(`/api/compliance/gauge?distillery_id=${id}`).then((r) => r.json()),
      fetch(`/api/compliance/production?distillery_id=${id}`).then((r) => r.json()),
      fetch(`/api/compliance/processing?distillery_id=${id}`).then((r) => r.json()),
      fetch(`/api/compliance/inventory?distillery_id=${id}`).then((r) => r.json()),
      createClient().from('ttb_reports').select('*').eq('distillery_id', id).order('report_month', { ascending: false }).then(({ data }) => data ?? []),
      fetch(`/api/compliance/import-history?distillery_id=${id}`).then((r) => r.json()),
    ])
    if ((histRes?.count ?? 0) === 0) setShowImportBanner(true)
    setSnapshots(Array.isArray(snaps) ? snaps : [])
    setGaugeRecords(Array.isArray(gaugRes) ? gaugRes : [])
    setProductionLogs(Array.isArray(prodRes) ? prodRes : [])
    setProcessingLogs(Array.isArray(procRes) ? procRes : [])
    setAttestations(Array.isArray(attRes) ? attRes : [])
    setReports(rptRes as TtbReport[])
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      getMyDistilleryId(supabase, user.id).then(async (id) => {
        if (!id) return
        setDistilleryId(id)
        const { data: d } = await supabase.from('distilleries').select('name,dsp_number').eq('id', id).single()
        if (d) { setDistilleryName(d.name); setDspNumber(d.dsp_number ?? '') }
        load(id)
      })
    })
  }, [load])

  async function reconcile(period: string) {
    if (!distilleryId) return
    setReconciling(period)
    const data = await fetch('/api/compliance/reconcile', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ distillery_id: distilleryId, period }) }).then((r) => r.json())
    if (Array.isArray(data)) setSnapshots((p) => [...data, ...p.filter((s) => s.period !== period)])
    setReconciling(null)
  }

  async function markSnapshotFiled(id: string) {
    const updated = await fetch('/api/compliance/snapshots', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'filed' }) }).then((r) => r.json())
    if (updated.id) setSnapshots((p) => p.map((s) => s.id === id ? { ...s, status: 'filed' as const } : s))
  }

  async function generateReport(month: string) {
    if (!distilleryId) return
    setGenerating(month)
    const data = await fetch('/api/compliance/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ distillery_id: distilleryId, month }) }).then((r) => r.json())
    if (data.id) setReports((p) => [data, ...p.filter((r) => r.report_month !== month)])
    setGenerating(null)
  }

  async function loadForm() {
    if (!distilleryId) return
    setFormLoading(true)
    setFormData(null)
    const data = await fetch(`/api/compliance/forms/${selectedFormType}?distillery_id=${distilleryId}&period=${selectedPeriod}`).then((r) => r.json())
    setFormData(data)
    setFormLoading(false)
  }

  // ── Deadline overview ────────────────────────────────────────────────────────
  const snapshotMap = new Map<string, ComplianceSnapshot[]>()
  for (const s of snapshots) {
    const arr = snapshotMap.get(s.period) ?? []; arr.push(s); snapshotMap.set(s.period, arr)
  }
  const reportMap = new Map(reports.map((r) => [r.report_month, r]))

  // current month zero-activity check
  const currentPeriod = months[0].date
  const currentSnaps = snapshotMap.get(currentPeriod) ?? []
  const currentProdLogs = productionLogs.filter((l) => l.occurred_at.startsWith(currentPeriod.slice(0, 7)))
  const currentProcLogs = processingLogs.filter((l) => l.occurred_at.startsWith(currentPeriod.slice(0, 7)))
  const daysLeft = daysUntilDue(currentPeriod)
  const isLastWeek = daysLeft <= 7 && daysLeft >= 0

  // FET estimate from tax removals
  const ytdRemovals = processingLogs.filter((l) => l.log_type === 'tax_removal' && l.occurred_at.startsWith(new Date().getFullYear().toString()))
  const ytdPG = ytdRemovals.reduce((s, l) => s + (l.proof_gallons ?? 0), 0)
  const fetEstimate = ytdPG <= FET_CBMA_THRESHOLD ? ytdPG * FET_RATE_REDUCED : (FET_CBMA_THRESHOLD * FET_RATE_REDUCED) + ((ytdPG - FET_CBMA_THRESHOLD) * 13.50)

  // ── Gauge form state ─────────────────────────────────────────────────────────
  const [gaugeForm, setGaugeForm] = useState({ gauge_type: 'fill', container_id: '', gauged_at: new Date().toISOString().slice(0, 16), temperature_f: '60', proof: '', wine_gallons: '', gauge_officer: '', cooperage_code: 'C', package_id: '', gross_weight_lbs: '', notes: '' })
  const [gaugeSaving, setGaugeSaving] = useState(false)
  const [showGaugeForm, setShowGaugeForm] = useState(false)

  async function saveGauge() {
    if (!distilleryId) return
    setGaugeSaving(true)
    const data = await fetch('/api/compliance/gauge', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ distillery_id: distilleryId, ...gaugeForm, temperature_f: parseFloat(gaugeForm.temperature_f), proof: parseFloat(gaugeForm.proof), wine_gallons: parseFloat(gaugeForm.wine_gallons), gross_weight_lbs: gaugeForm.gross_weight_lbs ? parseFloat(gaugeForm.gross_weight_lbs) : null, gauged_at: new Date(gaugeForm.gauged_at).toISOString() }) }).then((r) => r.json())
    if (data.id) { setGaugeRecords((p) => [data, ...p]); setShowGaugeForm(false) }
    setGaugeSaving(false)
  }

  // ── Production form state ────────────────────────────────────────────────────
  const [prodForm, setProdForm] = useState({ log_type: 'mash_batch', batch_number: '', grain_quantity_lbs: '', spirits_type: 'bourbon', spirits_produced_proof_gallons: '', spirits_produced_wine_gallons: '', transfer_proof_gallons: '', transfer_wine_gallons: '', transfer_proof: '', loss_proof_gallons: '', loss_cause: '', still_id: '', fermentation_start: '', fermentation_end: '', occurred_at: new Date().toISOString().split('T')[0], notes: '' })
  const [prodSaving, setProdSaving] = useState(false)
  const [showProdForm, setShowProdForm] = useState(false)

  async function saveProd() {
    if (!distilleryId) return
    setProdSaving(true)
    const payload: Record<string, unknown> = { distillery_id: distilleryId, log_type: prodForm.log_type, occurred_at: new Date(prodForm.occurred_at).toISOString(), notes: prodForm.notes || null }
    if (prodForm.log_type === 'mash_batch') { payload.batch_number = prodForm.batch_number || null; payload.grain_quantity_lbs = prodForm.grain_quantity_lbs ? parseFloat(prodForm.grain_quantity_lbs) : null }
    if (prodForm.log_type === 'fermentation') { payload.fermentation_start = prodForm.fermentation_start || null; payload.fermentation_end = prodForm.fermentation_end || null }
    if (prodForm.log_type === 'distillation') { payload.still_id = prodForm.still_id || null; payload.spirits_type = prodForm.spirits_type; payload.spirits_produced_proof_gallons = prodForm.spirits_produced_proof_gallons ? parseFloat(prodForm.spirits_produced_proof_gallons) : null; payload.spirits_produced_wine_gallons = prodForm.spirits_produced_wine_gallons ? parseFloat(prodForm.spirits_produced_wine_gallons) : null }
    if (prodForm.log_type === 'transfer_to_storage') { payload.transfer_proof_gallons = prodForm.transfer_proof_gallons ? parseFloat(prodForm.transfer_proof_gallons) : null; payload.transfer_wine_gallons = prodForm.transfer_wine_gallons ? parseFloat(prodForm.transfer_wine_gallons) : null; payload.transfer_proof = prodForm.transfer_proof ? parseFloat(prodForm.transfer_proof) : null }
    if (prodForm.log_type === 'production_loss') { payload.loss_proof_gallons = prodForm.loss_proof_gallons ? parseFloat(prodForm.loss_proof_gallons) : null; payload.loss_cause = prodForm.loss_cause || null }
    const data = await fetch('/api/compliance/production', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then((r) => r.json())
    if (data.id) { setProductionLogs((p) => [data, ...p]); setShowProdForm(false) }
    setProdSaving(false)
  }

  // ── Processing form state ────────────────────────────────────────────────────
  const [procForm, setProcForm] = useState({ log_type: 'bottling_run', spirits_type: 'bourbon', product_name: '', proof: '', wine_gallons: '', proof_gallons: '', bottles_filled: '', bottle_size_ml: '750', case_count: '', removal_type: 'tasting_room', loss_cause: 'breakage', occurred_at: new Date().toISOString().split('T')[0], notes: '' })
  const [procSaving, setProcSaving] = useState(false)
  const [showProcForm, setShowProcForm] = useState(false)

  async function saveProc() {
    if (!distilleryId) return
    setProcSaving(true)
    const payload: Record<string, unknown> = { distillery_id: distilleryId, log_type: procForm.log_type, spirits_type: procForm.spirits_type || null, product_name: procForm.product_name || null, proof: procForm.proof ? parseFloat(procForm.proof) : null, wine_gallons: procForm.wine_gallons ? parseFloat(procForm.wine_gallons) : null, occurred_at: new Date(procForm.occurred_at).toISOString(), notes: procForm.notes || null }
    const wg = procForm.wine_gallons ? parseFloat(procForm.wine_gallons) : 0
    const pf = procForm.proof ? parseFloat(procForm.proof) : 0
    payload.proof_gallons = procForm.proof_gallons ? parseFloat(procForm.proof_gallons) : (wg && pf ? calcProofGallons(wg, pf) : null)
    if (procForm.log_type === 'bottling_run') { payload.bottles_filled = procForm.bottles_filled ? parseInt(procForm.bottles_filled) : null; payload.bottle_size_ml = procForm.bottle_size_ml ? parseFloat(procForm.bottle_size_ml) : null; payload.case_count = procForm.case_count ? parseInt(procForm.case_count) : null }
    if (procForm.log_type === 'tax_removal') payload.removal_type = procForm.removal_type
    if (['leaker', 'processing_loss'].includes(procForm.log_type)) payload.loss_cause = procForm.loss_cause
    const data = await fetch('/api/compliance/processing', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }).then((r) => r.json())
    if (data.id) { setProcessingLogs((p) => [data, ...p]); setShowProcForm(false) }
    setProcSaving(false)
  }

  // ── Inventory attestation form ───────────────────────────────────────────────
  const [invForm, setInvForm] = useState({ inventory_type: 'quarterly_storage', period_label: '', inventory_date: new Date().toISOString().split('T')[0], total_proof_gallons: '', barrel_count: '', container_count: '', attested_by_name: '', signed_by_title: '' })
  const [invSaving, setInvSaving] = useState(false)
  const [showInvForm, setShowInvForm] = useState(false)

  async function saveInventory(attest: boolean) {
    if (!distilleryId) return
    setInvSaving(true)
    const res = await fetch('/api/compliance/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ distillery_id: distilleryId, inventory_type: invForm.inventory_type, period_label: invForm.period_label, inventory_date: invForm.inventory_date, total_proof_gallons: parseFloat(invForm.total_proof_gallons) || 0, barrel_count: invForm.barrel_count ? parseInt(invForm.barrel_count) : null, container_count: invForm.container_count ? parseInt(invForm.container_count) : null, attested_by_name: invForm.attested_by_name, signed_by_title: invForm.signed_by_title, attest }) }).then((r) => r.json())
    // If PDF bytes returned, trigger download
    if (attest && res.pdf_bytes) {
      const blob = new Blob([Uint8Array.from(atob(res.pdf_bytes), (c) => c.charCodeAt(0))], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a'); a.href = url; a.download = `inventory-attestation-${invForm.inventory_date}.pdf`; a.click()
      URL.revokeObjectURL(url)
    }
    const data = res
    if (data.id) { setAttestations((p) => [data, ...p]); setShowInvForm(false) }
    setInvSaving(false)
  }

  if (!distilleryId) return <div className="text-sm text-[var(--color-text-muted)] p-4">Loading compliance records…</div>

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <OverdueBanner distilleryId={distilleryId} />
      {showImportBanner && (
        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-3 flex items-start justify-between gap-3">
          <div className="text-sm text-blue-400">
            <p className="font-medium">No historical filings on file</p>
            <p className="text-xs mt-0.5">Import prior-year TTB reports so continuity checks start from accurate balances.</p>
          </div>
          <div className="flex gap-2 shrink-0">
            <a href="/compliance/import-history" className="text-xs px-2.5 py-1.5 rounded-md bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-all">Import history</a>
            <button onClick={() => setShowImportBanner(false)} className="text-xs text-blue-400/60 hover:text-blue-400">✕</button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-medium text-lg">TTB Compliance</h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {distilleryName}{dspNumber ? ` · DSP ${dspNumber}` : ' · No DSP number — add in distillery settings'}
          </p>
        </div>
        {isLastWeek && <PillBadge label={`Monthly reports due in ${daysLeft}d`} color="amber" />}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-secondary)] overflow-x-auto">
        {(['overview','gauge','production','processing','inventory','forms','snapshots'] as Tab[]).map((t) => (
          <TabBtn key={t} label={{ overview: 'Overview', gauge: 'Gauge', production: 'Production', processing: 'Processing', inventory: 'Inventory', forms: 'Forms', snapshots: 'Proof Gal' }[t]} active={tab === t} onClick={() => setTab(t)} />
        ))}
      </div>

      {/* ── Overview ─────────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-4">
          {/* FET estimate */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Proof gal removed YTD', value: ytdPG.toFixed(2) },
              { label: 'Est. FET liability', value: `$${fetEstimate.toFixed(0)}` },
              { label: 'CBMA threshold remaining', value: `${(FET_CBMA_THRESHOLD - ytdPG).toFixed(0)} PG` },
              { label: 'Gauge records this month', value: gaugeRecords.filter((g) => g.gauged_at.startsWith(currentPeriod.slice(0, 7))).length.toString() },
            ].map(({ label, value }) => (
              <Card key={label} className="p-3">
                <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
                <div className="text-lg font-mono font-medium text-[var(--color-text)] mt-1">{value}</div>
              </Card>
            ))}
          </div>

          {/* Zero-activity warnings */}
          {currentProdLogs.length === 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-400">
              No production logs for {months[0].label}. If production occurred, log it under the Production tab. If no production occurred, a zero-activity Form 5110.40 is still required by the 15th.
            </div>
          )}
          {currentProcLogs.length === 0 && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-400">
              No processing logs for {months[0].label}. If bottling occurred, log it under the Processing tab. Zero-activity Form 5110.28 is still required.
            </div>
          )}

          {/* Monthly filing status */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">Monthly Filing Status</p>
            {months.slice(0, 6).map(({ date, label }) => {
              const snaps = snapshotMap.get(date) ?? []
              const report = reportMap.get(date)
              const d = daysUntilDue(date)
              const overdue = d < 0
              return (
                <Card key={date} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="text-sm font-medium">{label}</div>
                    {overdue && snaps.length === 0 && <PillBadge label="Overdue" color="red" />}
                    {!overdue && d <= 7 && snaps.length === 0 && <PillBadge label={`Due in ${d}d`} color="amber" />}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-[var(--color-text-muted)]">5110.11:</span>
                    {snaps.length > 0 ? <PillBadge label={snaps.every((s) => s.status === 'filed') ? 'Filed' : 'Draft'} color={snaps.every((s) => s.status === 'filed') ? 'green' : 'amber'} /> : <PillBadge label="Not run" color="gray" />}
                    <Button size="sm" variant="secondary" onClick={() => { setTab('forms'); setSelectedPeriod(date) }}>View</Button>
                  </div>
                </Card>
              )
            })}
          </div>

          {/* Quarterly inventory alerts */}
          {(() => {
            const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
            const now = new Date()
            const currentQ = `Q${Math.ceil((now.getMonth() + 1) / 3)} ${now.getFullYear()}`
            const hasCurrentQ = attestations.some((a) => a.period_label === currentQ && a.inventory_type === 'quarterly_storage')
            if (!hasCurrentQ) return (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-400">
                No quarterly storage inventory for {currentQ}. Required by 27 CFR 19.133 — complete under the Inventory tab.
              </div>
            )
          })()}
        </div>
      )}

      {/* ── Gauge Records ────────────────────────────────────────────────────── */}
      {tab === 'gauge' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Required per 27 CFR 19.618 at production, barrel fill, bottling, post-TIB, and when tampering is detected.</p>
            </div>
            <Button size="sm" onClick={() => setShowGaugeForm(!showGaugeForm)}>{showGaugeForm ? 'Cancel' : '+ New gauge'}</Button>
          </div>

          {showGaugeForm && (
            <Card className="space-y-3">
              <p className="text-sm font-medium">Log gauge record</p>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Gauge type" value={gaugeForm.gauge_type} onChange={(e) => setGaugeForm((f) => ({ ...f, gauge_type: e.target.value }))}>
                  {Object.entries(GAUGE_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
                <Input label="Container / barrel ID *" value={gaugeForm.container_id} onChange={(e) => setGaugeForm((f) => ({ ...f, container_id: e.target.value }))} placeholder="e.g. CR-041" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date & time *" type="datetime-local" value={gaugeForm.gauged_at} onChange={(e) => setGaugeForm((f) => ({ ...f, gauged_at: e.target.value }))} />
                <Input label="Temperature (°F) *" type="number" value={gaugeForm.temperature_f} onChange={(e) => setGaugeForm((f) => ({ ...f, temperature_f: e.target.value }))} placeholder="60" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Proof *" type="number" value={gaugeForm.proof} onChange={(e) => setGaugeForm((f) => ({ ...f, proof: e.target.value }))} placeholder="e.g. 125" />
                <Input label="Wine gallons *" type="number" value={gaugeForm.wine_gallons} onChange={(e) => setGaugeForm((f) => ({ ...f, wine_gallons: e.target.value }))} placeholder="e.g. 53.0" />
              </div>
              {gaugeForm.proof && gaugeForm.wine_gallons && (
                <p className="text-xs text-[var(--color-text-muted)]">Proof gallons: <span className="font-mono text-primary">{calcProofGallons(parseFloat(gaugeForm.wine_gallons) || 0, parseFloat(gaugeForm.proof) || 0).toFixed(3)}</span></p>
              )}
              <Input label="Gauge officer *" value={gaugeForm.gauge_officer} onChange={(e) => setGaugeForm((f) => ({ ...f, gauge_officer: e.target.value }))} placeholder="Name of employee performing gauge" />
              {['fill', 'regauge', 'post_tib'].includes(gaugeForm.gauge_type) && (
                <div className="grid grid-cols-3 gap-3">
                  <Select label="Cooperage code" value={gaugeForm.cooperage_code} onChange={(e) => setGaugeForm((f) => ({ ...f, cooperage_code: e.target.value }))}>
                    {COOPERAGE_CODES.map((c) => <option key={c.value} value={c.value}>{c.value} — {c.label.split('—')[1]?.trim()}</option>)}
                  </Select>
                  <Input label="Package ID" value={gaugeForm.package_id} onChange={(e) => setGaugeForm((f) => ({ ...f, package_id: e.target.value }))} placeholder="Barrel number" />
                  <Input label="Gross weight (lbs)" type="number" value={gaugeForm.gross_weight_lbs} onChange={(e) => setGaugeForm((f) => ({ ...f, gross_weight_lbs: e.target.value }))} />
                </div>
              )}
              <Input label="Notes" value={gaugeForm.notes} onChange={(e) => setGaugeForm((f) => ({ ...f, notes: e.target.value }))} />
              <Button onClick={saveGauge} loading={gaugeSaving} disabled={!gaugeForm.container_id || !gaugeForm.proof || !gaugeForm.wine_gallons || !gaugeForm.gauge_officer}>Save gauge record</Button>
            </Card>
          )}

          <div className="space-y-2">
            {gaugeRecords.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No gauge records yet. Gauging is required at every barrel fill — records are auto-created when you add a barrel.</p>}
            {gaugeRecords.map((g) => (
              <Card key={g.id} className="text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="font-medium">{GAUGE_TYPE_LABELS[g.gauge_type]}</span>
                    <span className="text-[var(--color-text-muted)] ml-2">{g.container_id}</span>
                    {g.cooperage_code && <span className="ml-2 text-xs px-1.5 py-0.5 rounded bg-[var(--color-bg-secondary)]">Code {g.cooperage_code}</span>}
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)] shrink-0">{formatDate(g.gauged_at)}</span>
                </div>
                <div className="grid grid-cols-3 gap-2 mt-2 text-xs font-mono text-[var(--color-text-muted)]">
                  <span>Proof: {g.proof}°</span>
                  <span>{formatWineGal(g.wine_gallons)}</span>
                  <span>{formatProofGal(g.proof_gallons)}</span>
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1">Temp: {g.temperature_f}°F · Officer: {g.gauge_officer}</div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Production Account (5110.40) ─────────────────────────────────────── */}
      {tab === 'production' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-text-muted)]">Production account — mash batches, fermentation, distillation runs, transfers to storage, losses. Feeds Form 5110.40.</p>
            <Button size="sm" onClick={() => setShowProdForm(!showProdForm)}>{showProdForm ? 'Cancel' : '+ Log entry'}</Button>
          </div>

          {showProdForm && (
            <Card className="space-y-3">
              <Select label="Entry type" value={prodForm.log_type} onChange={(e) => setProdForm((f) => ({ ...f, log_type: e.target.value }))}>
                {Object.entries(PRODUCTION_LOG_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
              <Input label="Date" type="date" value={prodForm.occurred_at} onChange={(e) => setProdForm((f) => ({ ...f, occurred_at: e.target.value }))} />

              {prodForm.log_type === 'mash_batch' && (
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Batch number" value={prodForm.batch_number} onChange={(e) => setProdForm((f) => ({ ...f, batch_number: e.target.value }))} placeholder="e.g. MB-2026-01" />
                  <Input label="Total grain (lbs)" type="number" value={prodForm.grain_quantity_lbs} onChange={(e) => setProdForm((f) => ({ ...f, grain_quantity_lbs: e.target.value }))} />
                </div>
              )}
              {prodForm.log_type === 'fermentation' && (
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Start date" type="date" value={prodForm.fermentation_start} onChange={(e) => setProdForm((f) => ({ ...f, fermentation_start: e.target.value }))} />
                  <Input label="End date" type="date" value={prodForm.fermentation_end} onChange={(e) => setProdForm((f) => ({ ...f, fermentation_end: e.target.value }))} />
                </div>
              )}
              {prodForm.log_type === 'distillation' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Still ID" value={prodForm.still_id} onChange={(e) => setProdForm((f) => ({ ...f, still_id: e.target.value }))} placeholder="Still-1" />
                    <Select label="Spirit class" value={prodForm.spirits_type} onChange={(e) => setProdForm((f) => ({ ...f, spirits_type: e.target.value }))}>
                      {TTB_SPIRITS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Proof gallons produced" type="number" value={prodForm.spirits_produced_proof_gallons} onChange={(e) => setProdForm((f) => ({ ...f, spirits_produced_proof_gallons: e.target.value }))} />
                    <Input label="Wine gallons produced" type="number" value={prodForm.spirits_produced_wine_gallons} onChange={(e) => setProdForm((f) => ({ ...f, spirits_produced_wine_gallons: e.target.value }))} />
                  </div>
                </div>
              )}
              {prodForm.log_type === 'transfer_to_storage' && (
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Wine gallons" type="number" value={prodForm.transfer_wine_gallons} onChange={(e) => setProdForm((f) => ({ ...f, transfer_wine_gallons: e.target.value }))} />
                  <Input label="Proof" type="number" value={prodForm.transfer_proof} onChange={(e) => setProdForm((f) => ({ ...f, transfer_proof: e.target.value }))} />
                  <Input label="Proof gallons" type="number" value={prodForm.transfer_proof_gallons} onChange={(e) => setProdForm((f) => ({ ...f, transfer_proof_gallons: e.target.value }))} />
                </div>
              )}
              {prodForm.log_type === 'production_loss' && (
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Proof gallons lost" type="number" value={prodForm.loss_proof_gallons} onChange={(e) => setProdForm((f) => ({ ...f, loss_proof_gallons: e.target.value }))} />
                  <Input label="Cause" value={prodForm.loss_cause} onChange={(e) => setProdForm((f) => ({ ...f, loss_cause: e.target.value }))} placeholder="e.g. Still leak, spillage" />
                </div>
              )}
              <Input label="Notes" value={prodForm.notes} onChange={(e) => setProdForm((f) => ({ ...f, notes: e.target.value }))} />
              <Button onClick={saveProd} loading={prodSaving}>Save entry</Button>
            </Card>
          )}

          <div className="space-y-2">
            {productionLogs.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No production logs yet. Log mash batches, fermentation runs, and distillation here to auto-populate Form 5110.40.</p>}
            {productionLogs.map((l) => (
              <Card key={l.id} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{PRODUCTION_LOG_LABELS[l.log_type]}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{formatDate(l.occurred_at)}</span>
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1">
                  {l.log_type === 'distillation' && l.spirits_produced_proof_gallons && `${l.spirits_produced_proof_gallons} PG produced · ${spiritsLabel(l.spirits_type ?? '')}`}
                  {l.log_type === 'mash_batch' && l.batch_number && `Batch ${l.batch_number}${l.grain_quantity_lbs ? ` · ${l.grain_quantity_lbs} lbs grain` : ''}`}
                  {l.log_type === 'transfer_to_storage' && l.transfer_proof_gallons && `${l.transfer_proof_gallons} PG transferred`}
                  {l.log_type === 'production_loss' && l.loss_proof_gallons && `${l.loss_proof_gallons} PG loss — ${l.loss_cause}`}
                  {l.notes && ` · ${l.notes}`}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Processing Account (5110.28) ─────────────────────────────────────── */}
      {tab === 'processing' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-text-muted)]">Processing account — bottling runs, remnant/leaker records, tax-determined removals. Feeds Form 5110.28.</p>
            <Button size="sm" onClick={() => setShowProcForm(!showProcForm)}>{showProcForm ? 'Cancel' : '+ Log entry'}</Button>
          </div>

          {showProcForm && (
            <Card className="space-y-3">
              <Select label="Entry type" value={procForm.log_type} onChange={(e) => setProcForm((f) => ({ ...f, log_type: e.target.value }))}>
                {Object.entries(PROCESSING_LOG_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date" type="date" value={procForm.occurred_at} onChange={(e) => setProcForm((f) => ({ ...f, occurred_at: e.target.value }))} />
                <Select label="Spirit class" value={procForm.spirits_type} onChange={(e) => setProcForm((f) => ({ ...f, spirits_type: e.target.value }))}>
                  {TTB_SPIRITS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Wine gallons" type="number" value={procForm.wine_gallons} onChange={(e) => setProcForm((f) => ({ ...f, wine_gallons: e.target.value }))} />
                <Input label="Proof" type="number" value={procForm.proof} onChange={(e) => setProcForm((f) => ({ ...f, proof: e.target.value }))} />
                <Input label="Proof gallons" type="number" value={procForm.proof_gallons} onChange={(e) => setProcForm((f) => ({ ...f, proof_gallons: e.target.value }))} placeholder="Auto-calc if blank" />
              </div>

              {procForm.log_type === 'bottling_run' && (
                <div className="grid grid-cols-3 gap-3">
                  <Input label="Product name" value={procForm.product_name} onChange={(e) => setProcForm((f) => ({ ...f, product_name: e.target.value }))} />
                  <Input label="Bottles filled" type="number" value={procForm.bottles_filled} onChange={(e) => setProcForm((f) => ({ ...f, bottles_filled: e.target.value }))} />
                  <Input label="Bottle size (mL)" type="number" value={procForm.bottle_size_ml} onChange={(e) => setProcForm((f) => ({ ...f, bottle_size_ml: e.target.value }))} />
                </div>
              )}
              {procForm.log_type === 'tax_removal' && (
                <Select label="Removal type" value={procForm.removal_type} onChange={(e) => setProcForm((f) => ({ ...f, removal_type: e.target.value }))}>
                  <option value="tasting_room">Tasting room</option>
                  <option value="retail">Retail</option>
                  <option value="wholesale">Wholesale / distributor</option>
                  <option value="export">Export</option>
                </Select>
              )}
              {['leaker', 'processing_loss'].includes(procForm.log_type) && (
                <Select label="Loss cause" value={procForm.loss_cause} onChange={(e) => setProcForm((f) => ({ ...f, loss_cause: e.target.value }))}>
                  <option value="breakage">Breakage</option>
                  <option value="leaker">Leaker</option>
                  <option value="spillage">Spillage</option>
                  <option value="evaporation">Evaporation</option>
                  <option value="other">Other</option>
                </Select>
              )}
              <Input label="Notes" value={procForm.notes} onChange={(e) => setProcForm((f) => ({ ...f, notes: e.target.value }))} />
              <Button onClick={saveProc} loading={procSaving}>Save entry</Button>
            </Card>
          )}

          <div className="space-y-2">
            {processingLogs.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No processing logs yet. Log bottling runs and tax-determined removals here to auto-populate Form 5110.28.</p>}
            {processingLogs.map((l) => (
              <Card key={l.id} className="text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{PROCESSING_LOG_LABELS[l.log_type]}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">{formatDate(l.occurred_at)}</span>
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1 font-mono">
                  {l.proof_gallons != null && `${l.proof_gallons} PG`}
                  {l.log_type === 'bottling_run' && l.bottles_filled && ` · ${l.bottles_filled} bottles`}
                  {l.log_type === 'tax_removal' && l.removal_type && ` · ${l.removal_type.replace('_', ' ')}`}
                  {l.loss_cause && ` · ${l.loss_cause}`}
                  {l.product_name && ` · ${l.product_name}`}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Inventory Attestations ───────────────────────────────────────────── */}
      {tab === 'inventory' && (
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[var(--color-text-muted)]">Required per 27 CFR 19.623. Must include kind of spirits, container ID, quantity in proof gallons, date, and signed attestation with penalties-of-perjury statement. Storage account: quarterly. Processing account: semi-annually.</p>
              <p className="text-xs text-red-400 mt-1">⚠ Missing signature / perjury statement is the #1 most cited TTB audit violation.</p>
            </div>
            <Button size="sm" onClick={() => setShowInvForm(!showInvForm)}>{showInvForm ? 'Cancel' : '+ New inventory'}</Button>
          </div>

          {showInvForm && (
            <Card className="space-y-3">
              <p className="text-sm font-medium">Physical inventory record</p>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Inventory type" value={invForm.inventory_type} onChange={(e) => setInvForm((f) => ({ ...f, inventory_type: e.target.value }))}>
                  <option value="quarterly_storage">Quarterly — Storage account</option>
                  <option value="semi_annual_processing">Semi-annual — Processing account</option>
                </Select>
                <Input label="Period label *" value={invForm.period_label} onChange={(e) => setInvForm((f) => ({ ...f, period_label: e.target.value }))} placeholder="e.g. Q2 2026 or H1 2026" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Input label="Inventory date *" type="date" value={invForm.inventory_date} onChange={(e) => setInvForm((f) => ({ ...f, inventory_date: e.target.value }))} />
                <Input label="Total proof gallons *" type="number" value={invForm.total_proof_gallons} onChange={(e) => setInvForm((f) => ({ ...f, total_proof_gallons: e.target.value }))} />
                <Input label="Barrel count" type="number" value={invForm.barrel_count} onChange={(e) => setInvForm((f) => ({ ...f, barrel_count: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Full legal name *" value={invForm.attested_by_name} onChange={(e) => setInvForm((f) => ({ ...f, attested_by_name: e.target.value }))} placeholder="Full legal name" />
                <Input label="Title *" value={invForm.signed_by_title} onChange={(e) => setInvForm((f) => ({ ...f, signed_by_title: e.target.value }))} placeholder="e.g. Proprietor, DSP Manager" />
              </div>

              {invForm.attested_by_name && invForm.signed_by_title && invForm.total_proof_gallons && (
                <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] p-3 text-xs text-[var(--color-text-muted)] leading-relaxed">
                  <p className="font-medium text-[var(--color-text)] mb-1">Penalties of Perjury Statement (27 CFR 19.45)</p>
                  <p>Under penalties of perjury, I declare that I have examined this inventory, and to the best of my knowledge and belief it is true, correct, and complete as required by 27 CFR Part 19.</p>
                  <p className="mt-2">Signed: <strong>{invForm.attested_by_name}</strong>, <strong>{invForm.signed_by_title}</strong> · Date: <strong>{invForm.inventory_date}</strong> · Total proof gallons: <strong>{invForm.total_proof_gallons}</strong></p>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => saveInventory(false)} loading={invSaving}>Save as draft</Button>
                <Button onClick={() => saveInventory(true)} loading={invSaving} disabled={!invForm.attested_by_name || !invForm.signed_by_title || !invForm.total_proof_gallons || !invForm.period_label}>Sign & attest</Button>
              </div>
            </Card>
          )}

          <div className="space-y-2">
            {attestations.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No inventory attestations yet.</p>}
            {attestations.map((a) => (
              <Card key={a.id} className="text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">{a.period_label} — {a.inventory_type === 'quarterly_storage' ? 'Storage account' : 'Processing account'}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                      {formatDate(a.inventory_date)} · {a.total_proof_gallons.toFixed(2)} PG
                      {a.barrel_count ? ` · ${a.barrel_count} barrels` : ''}
                    </div>
                    {a.status === 'attested' && (
                      <div className="text-xs text-green-400 mt-0.5">
                        ✓ Attested by {a.attested_by_name} on {formatDate(a.attested_at ?? '')}
                      </div>
                    )}
                  </div>
                  <PillBadge label={a.status === 'attested' ? 'Signed' : 'Draft'} color={a.status === 'attested' ? 'green' : 'amber'} />
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* ── Forms Generator ──────────────────────────────────────────────────── */}
      {tab === 'forms' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[160px]">
              <Select label="Form" value={selectedFormType} onChange={(e) => setSelectedFormType(e.target.value)}>
                <option value="5110-11">Form 5110.11 — Storage Operations</option>
                <option value="5110-40">Form 5110.40 — Production Operations</option>
                <option value="5110-28">Form 5110.28 — Processing Operations</option>
              </Select>
            </div>
            <div className="flex-1 min-w-[160px]">
              <Select label="Period" value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value)}>
                {months.map(({ date, label }) => <option key={date} value={date}>{label}</option>)}
              </Select>
            </div>
            <Button onClick={loadForm} loading={formLoading}>Generate</Button>
          </div>

          {formData && <FormView data={formData} onReconcile={reconcile} reconciling={reconciling} onMarkFiled={markSnapshotFiled} snapshots={snapshots} />}

          <div className="pt-2 border-t border-[var(--color-border)]">
            <p className="text-xs text-[var(--color-text-muted)]">
              Joining mid-year or migrating from paper?{' '}
              <a href="/compliance/balance-wizard" className="text-primary underline">Import historical ending balances</a>{' '}
              so continuity checks work from your first month.
            </p>
          </div>
        </div>
      )}

      {/* ── Proof Gallon Snapshots ───────────────────────────────────────────── */}
      {tab === 'snapshots' && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-text-muted)]">Monthly proof-gallon reconciliation per spirits class. Reconcile each period, then file Form 5110.11 on the Forms tab.</p>
          {months.map(({ date, label }) => {
            const periodSnaps = snapshotMap.get(date) ?? []
            const isPast = new Date(date) < new Date()
            return (
              <Card key={date} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{label}</div>
                  <div className="flex items-center gap-2">
                    {periodSnaps.length > 0 ? (
                      <Button size="sm" variant="secondary" onClick={() => reconcile(date)} loading={reconciling === date}>Re-run</Button>
                    ) : isPast ? (
                      <Button size="sm" onClick={() => reconcile(date)} loading={reconciling === date}>Reconcile</Button>
                    ) : (
                      <PillBadge label="Upcoming" color="gray" />
                    )}
                  </div>
                </div>
                {periodSnaps.map((snap) => (
                  <div key={snap.id} className="rounded-lg bg-[var(--color-bg-secondary)] p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase">{spiritsLabel(snap.spirits_type)}</span>
                      <div className="flex items-center gap-2">
                        <PillBadge label={snap.status === 'filed' ? 'Filed' : 'Draft'} color={snap.status === 'filed' ? 'green' : 'amber'} />
                        {snap.status !== 'filed' && <Button variant="secondary" size="sm" onClick={() => markSnapshotFiled(snap.id)}>Mark filed</Button>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                      {[['Beginning', snap.beg_proof_gallons, ''], ['Received', snap.received_proof_gallons, 'text-green-400'], ['Removed', snap.removed_proof_gallons, 'text-red-400'], ['Ending', snap.end_proof_gallons, '']].map(([lbl, val, cls]) => (
                        <div key={String(lbl)}>
                          <div className="text-[var(--color-text-muted)]">{lbl}</div>
                          <div className={`font-mono ${cls}`}>{formatProofGal(val as number)}</div>
                        </div>
                      ))}
                    </div>
                    {Math.abs(snap.discrepancy_wine_gallons) > 0.01 && (
                      <div className={`text-xs rounded px-2 py-1 ${Math.abs(snap.discrepancy_wine_gallons) > 1 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                        Physical variance: {snap.discrepancy_wine_gallons > 0 ? '+' : ''}{snap.discrepancy_wine_gallons.toFixed(2)} WG — investigate before filing
                      </div>
                    )}
                  </div>
                ))}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── FormView component ────────────────────────────────────────────────────────
function FormView({ data, onReconcile, reconciling, onMarkFiled, snapshots }: {
  data: Record<string, unknown>
  onReconcile: (period: string) => void
  reconciling: string | null
  onMarkFiled: (id: string) => void
  snapshots: ComplianceSnapshot[]
}) {
  const d = data as Record<string, unknown>
  const formNum = d.form as string
  const isPrint = typeof window !== 'undefined'

  return (
    <div className="space-y-4">
      <Card className="space-y-4">
        {/* Form header */}
        <div className="border-b border-[var(--color-border)] pb-3">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs text-[var(--color-text-muted)] font-mono uppercase tracking-wide">TTB Form {formNum}</p>
              <h2 className="font-medium text-base">{d.title as string}</h2>
              <p className="text-sm text-[var(--color-text-muted)]">Period: {d.period as string} · Due: {d.due_date as string}</p>
            </div>
            <div className="text-right text-xs text-[var(--color-text-muted)]">
              <div>{d.distillery_name as string}</div>
              <div className="font-mono">{d.dsp_number ? `DSP ${d.dsp_number}` : 'No DSP number'}</div>
            </div>
          </div>
          {!!d.zero_activity && (
            <div className="mt-2 text-xs px-2 py-1.5 rounded bg-amber-500/10 text-amber-400">Zero-activity period — this form must still be filed showing zeros by {d.due_date as string}</div>
          )}
        </div>

        {/* 5110.11 — Storage */}
        {formNum === '5110.11' && (() => {
          const accounts = (d.spirits_accounts as Record<string, unknown>[]) ?? []
          return (
            <div className="space-y-4">
              {accounts.length === 0 && (
                <div className="text-sm text-[var(--color-text-muted)]">No snapshot data for this period. <button className="text-primary underline" onClick={() => onReconcile(d.period as string)}>Run reconciliation first.</button></div>
              )}
              {accounts.map((acc) => {
                const snap = snapshots.find((s) => s.spirits_type === acc.spirits_type)
                return (
                  <div key={acc.spirits_type as string} className="space-y-2">
                    <p className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{acc.spirits_type_label as string}</p>
                    {acc.continuity_check !== 'OK' && acc.continuity_check !== 'No prior period data' && (
                      <div className="text-xs rounded px-2 py-1 bg-red-500/10 text-red-400">Continuity check: {acc.continuity_check as string}</div>
                    )}
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      {[
                        ['Line 1 — Beginning inventory', acc.line_1_beginning_proof_gallons],
                        ['Line 2 — Received from production', acc.line_2_received_from_production],
                        ['Line 3 — Received via TIB', acc.line_3_received_tib],
                        ['Line 4 — Total on hand', acc.line_4_total_on_hand],
                        ['Line 5 — Transferred to processing', acc.line_5_transferred_to_processing],
                        ['Line 6 — Transferred out via TIB', acc.line_6_transferred_tib],
                        ['Line 7 — Losses (angel\'s share)', acc.line_7_losses_angels_share],
                        ['Line 10 — Ending inventory', acc.line_10_ending_proof_gallons],
                      ].map(([label, val]) => (
                        <div key={label as string} className="flex justify-between border-b border-[var(--color-border)] py-1 col-span-2 sm:col-span-1">
                          <span className="text-[var(--color-text-muted)]">{label as string}</span>
                          <span className="font-mono text-[var(--color-text)]">{typeof val === 'number' ? val.toFixed(3) : '—'} PG</span>
                        </div>
                      ))}
                    </div>
                    {snap && snap.status !== 'filed' && (
                      <Button size="sm" variant="secondary" onClick={() => onMarkFiled(snap.id)}>Mark 5110.11 filed</Button>
                    )}
                  </div>
                )
              })}
              <div className="border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-muted)]">
                <p className="font-medium text-[var(--color-text)] mb-1">Barrel Package Summary (27 CFR 19.591)</p>
                <p>Total barrels: <span className="font-mono">{d.total_barrels as number}</span> · Total proof gallons on hand: <span className="font-mono">{(d.total_proof_gallons_on_hand as number)?.toFixed(3)}</span> PG</p>
              </div>
            </div>
          )
        })()}

        {/* 5110.40 — Production */}
        {formNum === '5110.40' && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-1 text-xs">
              {[
                ['Mash batches', d.line_1_mash_batches],
                ['Fermentation runs', d.line_2_fermentations_started],
                ['Distillation runs', d.line_3_distillation_runs],
                ['Total produced (PG)', `${(d.line_5_total_produced_proof_gallons as number)?.toFixed(3)} PG`],
                ['Transferred to storage (PG)', `${(d.line_6_transferred_to_storage_proof_gallons as number)?.toFixed(3)} PG`],
                ['Production losses (PG)', `${(d.line_7_production_losses_proof_gallons as number)?.toFixed(3)} PG`],
                ['Production account ending', `${(d.line_9_ending_production_account as number)?.toFixed(3)} PG`],
              ].map(([label, val]) => (
                <div key={label as string} className="flex justify-between border-b border-[var(--color-border)] py-1 col-span-2 sm:col-span-1">
                  <span className="text-[var(--color-text-muted)]">{label as string}</span>
                  <span className="font-mono text-[var(--color-text)]">{String(val)}</span>
                </div>
              ))}
            </div>
            {(d.line_4_produced_by_type as Record<string, unknown>[])?.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[var(--color-text-muted)] mb-1">Production by spirit class</p>
                {(d.line_4_produced_by_type as Record<string, unknown>[]).map((row) => (
                  <div key={row.spirits_type as string} className="flex justify-between text-xs border-b border-[var(--color-border)] py-1">
                    <span>{row.label as string}</span>
                    <span className="font-mono">{(row.proof_gallons as number).toFixed(3)} PG</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 5110.28 — Processing */}
        {formNum === '5110.28' && (
          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-1 gap-1">
              {[
                ['Line 1 — Received from storage (PG)', `${(d.line_1_received_from_storage_proof_gallons as number)?.toFixed(3)} PG`],
                ['Line 2 — Bottled (PG)', `${(d.line_2_bottled_proof_gallons as number)?.toFixed(3)} PG`],
                ['Line 3 — Total bottles filled', d.line_3_total_bottles],
                ['Line 4 — Total cases', d.line_4_total_cases],
                ['Line 5 — Tax-determined removals (PG)', `${(d.line_5_tax_determined_removals_proof_gallons as number)?.toFixed(3)} PG`],
                ['Line 7 — Losses (PG)', `${(d.line_7_losses_breakage_leakers_proof_gallons as number)?.toFixed(3)} PG`],
                ['Line 8 — Remnant records', d.line_8_remnant_records],
                ['Line 9 — Leaker records', d.line_9_leaker_records],
                ['Line 10 — Ending processing account', `${(d.line_10_ending_processing_account as number)?.toFixed(3)} PG`],
              ].map(([label, val]) => (
                <div key={label as string} className="flex justify-between border-b border-[var(--color-border)] py-1">
                  <span className="text-[var(--color-text-muted)]">{label as string}</span>
                  <span className="font-mono text-[var(--color-text)]">{String(val ?? '0')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-[var(--color-text-muted)] pt-2 border-t border-[var(--color-border)]">
          Generated {new Date().toLocaleDateString()} · These numbers pre-populate your filing — enter them into TTB Online at ttbonline.gov. Still does not file directly with TTB.
        </p>
      </Card>
    </div>
  )
}
