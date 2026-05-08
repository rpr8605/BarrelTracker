'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase'
import { getMyDistilleryId } from '@/lib/distillery'
import { TTB_SPIRITS_TYPES } from '@/lib/ttb'

interface COLARecord {
  id: string; product_name: string; brand_name: string; spirit_class: string
  status: string; application_date?: string; ttb_tracking_number?: string
  approval_date?: string; cola_number?: string; submission_method?: string
  label_checklist: Record<string, boolean>; formula_record_id?: string; notes?: string
  created_at: string
}
interface FormulaRecord {
  id: string; product_name: string; spirit_class: string; formula_required: boolean
  formula_triggers: string[]; ingredients: Array<{ name: string; quantity: string; unit: string; purpose: string }>
  status: string; submission_date?: string; approval_date?: string; formula_number?: string
  version: number; previous_version_id?: string; notes?: string; created_at: string
}

const COLA_STATUS_COLORS: Record<string, string> = {
  pre_application: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]',
  submitted: 'bg-amber-500/10 text-amber-400',
  approved: 'bg-green-500/10 text-green-400',
  rejected: 'bg-danger/10 text-danger',
  amendment_needed: 'bg-amber-500/10 text-amber-400',
}
const FORMULA_STATUS_COLORS: Record<string, string> = {
  not_required: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]',
  not_submitted: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]',
  submitted: 'bg-amber-500/10 text-amber-400',
  approved: 'bg-green-500/10 text-green-400',
  rejected: 'bg-danger/10 text-danger',
}

const CHECKLIST_LABELS: Record<string, string> = {
  brand_name_on_front: 'Brand name on front label',
  class_type_designation: 'Class/type designation',
  abv_on_front_label: 'ABV on front label',
  abv_within_03_pct: 'ABV within 0.3% of actual',
  net_contents_metric: 'Net contents in metric',
  name_and_address: 'Name and address of bottler',
  health_warning_statement: 'Health warning statement',
}

const FORMULA_TRIGGERS = [
  'botanical_ingredients', 'added_flavors', 'added_colors',
  'added_sweeteners', 'non_standard_production',
]

export default function ProductsPage() {
  const [distilleryId, setDistilleryId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'cola' | 'formula'>('cola')
  const [cola, setCola] = useState<COLARecord[]>([])
  const [formula, setFormula] = useState<FormulaRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [versionModal, setVersionModal] = useState<string | null>(null)
  const [changeDesc, setChangeDesc] = useState('')

  const [colaForm, setColaForm] = useState({ product_name: '', brand_name: '', spirit_class: 'bourbon' })
  const [formulaForm, setFormulaForm] = useState({
    product_name: '', spirit_class: 'bourbon',
    formula_triggers: [] as string[],
  })

  const setCF = (k: string, v: string) => setColaForm((f) => ({ ...f, [k]: v }))
  const setFF = (k: string, v: string) => setFormulaForm((f) => ({ ...f, [k]: v }))

  const load = useCallback(async (did: string) => {
    const [c, f] = await Promise.all([
      fetch(`/api/products/cola?distillery_id=${did}`).then((x) => x.ok ? x.json() : []),
      fetch(`/api/products/formula?distillery_id=${did}`).then((x) => x.ok ? x.json() : []),
    ])
    setCola(c)
    setFormula(f)
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

  async function saveCOLA() {
    if (!distilleryId) return
    setSaving(true); setError('')
    const res = await fetch('/api/products/cola', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distillery_id: distilleryId, ...colaForm }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setCola((c) => [data, ...c])
    setShowForm(false); setSaving(false)
    setColaForm({ product_name: '', brand_name: '', spirit_class: 'bourbon' })
  }

  async function saveFormula() {
    if (!distilleryId) return
    setSaving(true); setError('')
    const res = await fetch('/api/products/formula', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distillery_id: distilleryId, ...formulaForm }),
    })
    const data = await res.json()
    if (!res.ok) { setError(data.error); setSaving(false); return }
    setFormula((f) => [data, ...f])
    setShowForm(false); setSaving(false)
    setFormulaForm({ product_name: '', spirit_class: 'bourbon', formula_triggers: [] })
  }

  async function patchCOLA(id: string, updates: Record<string, unknown>) {
    await fetch(`/api/products/cola/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (distilleryId) load(distilleryId)
  }

  async function patchFormula(id: string, updates: Record<string, unknown>) {
    const rec = formula.find((f) => f.id === id)
    if (rec?.status === 'approved' && updates.ingredients) {
      setVersionModal(id)
      return
    }
    await fetch(`/api/products/formula/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    if (distilleryId) load(distilleryId)
  }

  async function confirmVersioning(id: string, updates: Record<string, unknown>) {
    await fetch(`/api/products/formula/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...updates, change_description: changeDesc }),
    })
    setVersionModal(null); setChangeDesc('')
    if (distilleryId) load(distilleryId)
  }

  async function deleteCOLA(id: string) {
    await fetch(`/api/products/cola/${id}`, { method: 'DELETE' })
    setCola((c) => c.filter((r) => r.id !== id))
  }

  const unapproved = cola.filter((c) => c.status !== 'approved')

  if (loading) return <div className="text-sm text-[var(--color-text-muted)] p-4">Loading product records…</div>

  return (
    <div className="space-y-4 max-w-4xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold">Products</h1>
          <p className="text-sm text-[var(--color-text-muted)]">COLA (label approval) and formula records — 27 CFR Part 5</p>
        </div>
        <Button onClick={() => { setShowForm(!showForm); setError('') }} size="sm">
          {showForm ? 'Cancel' : `+ Add ${activeTab === 'cola' ? 'product' : 'formula'}`}
        </Button>
      </div>

      {/* COLA warning */}
      {unapproved.length > 0 && (
        <div className="text-xs px-3 py-2 rounded-lg bg-amber-500/10 text-amber-400">
          {unapproved.length} product{unapproved.length !== 1 ? 's' : ''} without approved COLA cannot be legally sold.
          Apply at <a href="https://www.ttb.gov/labeling/cola" target="_blank" rel="noreferrer" className="underline">ttb.gov/labeling/cola</a>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-secondary)] overflow-x-auto">
        {(['cola', 'formula'] as const).map((t) => (
          <button key={t} onClick={() => { setActiveTab(t); setShowForm(false) }}
            className={`px-3 py-1.5 text-sm rounded-md transition-all whitespace-nowrap ${activeTab === t ? 'bg-[var(--color-bg)] shadow-sm' : 'text-[var(--color-text-muted)]'}`}>
            {t === 'cola' ? `COLA Records (${cola.length})` : `Formula Records (${formula.length})`}
          </button>
        ))}
      </div>

      {/* COLA Add Form */}
      {showForm && activeTab === 'cola' && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium text-sm">Add product for COLA</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Product name" value={colaForm.product_name} onChange={(e) => setCF('product_name', e.target.value)} placeholder="e.g. Ridgeline Straight Bourbon" />
            <Input label="Brand name" value={colaForm.brand_name} onChange={(e) => setCF('brand_name', e.target.value)} placeholder="e.g. Ridgeline" />
          </div>
          <Select label="Spirit class" value={colaForm.spirit_class} onChange={(e) => setCF('spirit_class', e.target.value)}>
            {TTB_SPIRITS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button onClick={saveCOLA} loading={saving} disabled={!colaForm.product_name || !colaForm.brand_name}>Add product</Button>
        </Card>
      )}

      {/* Formula Add Form */}
      {showForm && activeTab === 'formula' && (
        <Card className="p-4 space-y-3">
          <h3 className="font-medium text-sm">Add formula record</h3>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Product name" value={formulaForm.product_name} onChange={(e) => setFF('product_name', e.target.value)} />
            <Select label="Spirit class" value={formulaForm.spirit_class} onChange={(e) => setFF('spirit_class', e.target.value)}>
              {TTB_SPIRITS_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </Select>
          </div>
          <div>
            <p className="text-xs text-[var(--color-text-muted)] mb-1.5">Formula triggers (select all that apply)</p>
            <div className="flex flex-wrap gap-2">
              {FORMULA_TRIGGERS.map((t) => (
                <button key={t} type="button"
                  onClick={() => setFormulaForm((f) => ({
                    ...f,
                    formula_triggers: f.formula_triggers.includes(t)
                      ? f.formula_triggers.filter((x) => x !== t)
                      : [...f.formula_triggers, t],
                  }))}
                  className={`text-xs px-2 py-1 rounded-full border transition-all ${formulaForm.formula_triggers.includes(t) ? 'border-primary bg-primary/10 text-primary' : 'border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
                  {t.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button onClick={saveFormula} loading={saving} disabled={!formulaForm.product_name}>Add formula</Button>
        </Card>
      )}

      {/* COLA List */}
      {activeTab === 'cola' && (
        <div className="space-y-2">
          {cola.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No COLA records yet. Add your first product to get started.</p>}
          {cola.map((r) => (
            <Card key={r.id} className="space-y-0">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.product_name}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">{r.brand_name} · {r.spirit_class.replace(/_/g, ' ')}{r.cola_number ? ` · COLA# ${r.cola_number}` : ''}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${COLA_STATUS_COLORS[r.status] ?? ''}`}>{r.status.replace(/_/g, ' ')}</span>
                  <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                    {expandedId === r.id ? '▲' : '▼'}
                  </button>
                  {r.status === 'pre_application' && (
                    <button onClick={() => deleteCOLA(r.id)} className="text-xs text-danger hover:opacity-70">✕</button>
                  )}
                </div>
              </div>

              {expandedId === r.id && (
                <div className="border-t border-[var(--color-border)] pt-3 pb-2 px-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Select label="Status" value={r.status} onChange={(e) => patchCOLA(r.id, { status: e.target.value })}>
                      {['pre_application','submitted','approved','rejected','amendment_needed'].map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </Select>
                    <Input label="COLA number" defaultValue={r.cola_number ?? ''} onBlur={(e) => { if (e.target.value !== (r.cola_number ?? '')) patchCOLA(r.id, { cola_number: e.target.value }) }} placeholder="Assigned by TTB" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Application date" type="date" defaultValue={r.application_date ?? ''} onBlur={(e) => patchCOLA(r.id, { application_date: e.target.value || null })} />
                    <Input label="Approval date" type="date" defaultValue={r.approval_date ?? ''} onBlur={(e) => patchCOLA(r.id, { approval_date: e.target.value || null })} />
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-1.5">Label checklist</p>
                    <div className="space-y-1">
                      {Object.entries(r.label_checklist).map(([key, checked]) => (
                        <label key={key} className="flex items-center gap-2 text-xs cursor-pointer">
                          <input type="checkbox" checked={!!checked} onChange={(e) =>
                            patchCOLA(r.id, { label_checklist: { ...r.label_checklist, [key]: e.target.checked } })
                          } className="accent-primary" />
                          {CHECKLIST_LABELS[key] ?? key.replace(/_/g, ' ')}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Formula List */}
      {activeTab === 'formula' && (
        <div className="space-y-2">
          {formula.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No formula records yet.</p>}
          {formula.map((r) => (
            <Card key={r.id} className="space-y-0">
              <div className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.product_name} {r.version > 1 ? `v${r.version}` : ''}</p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {r.spirit_class.replace(/_/g, ' ')}
                    {r.formula_triggers.length > 0 && ` · ${r.formula_triggers.map((t) => t.replace(/_/g, ' ')).join(', ')}`}
                    {r.formula_number ? ` · #${r.formula_number}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${FORMULA_STATUS_COLORS[r.status] ?? ''}`}>{r.status.replace(/_/g, ' ')}</span>
                  <button onClick={() => setExpandedId(expandedId === r.id ? null : r.id)} className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
                    {expandedId === r.id ? '▲' : '▼'}
                  </button>
                </div>
              </div>

              {expandedId === r.id && (
                <div className="border-t border-[var(--color-border)] pt-3 pb-2 px-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <Select label="Status" value={r.status} onChange={(e) => patchFormula(r.id, { status: e.target.value })}>
                      {['not_required','not_submitted','submitted','approved','rejected'].map((s) => (
                        <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                      ))}
                    </Select>
                    <Input label="Formula number" defaultValue={r.formula_number ?? ''} onBlur={(e) => { if (e.target.value !== (r.formula_number ?? '')) patchFormula(r.id, { formula_number: e.target.value }) }} placeholder="Assigned by TTB" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Submission date" type="date" defaultValue={r.submission_date ?? ''} onBlur={(e) => patchFormula(r.id, { submission_date: e.target.value || null })} />
                    <Input label="Approval date" type="date" defaultValue={r.approval_date ?? ''} onBlur={(e) => patchFormula(r.id, { approval_date: e.target.value || null })} />
                  </div>
                  {r.formula_required && r.status !== 'approved' && (
                    <p className="text-xs text-amber-400">Formula approval (Form 5110.38) required before production of this product.</p>
                  )}
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* Version modal */}
      {versionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <Card className="max-w-md w-full p-5 space-y-3 mx-4">
            <h3 className="font-medium">Create new formula version?</h3>
            <p className="text-sm text-[var(--color-text-muted)]">
              Modifying an approved formula requires a new TTB submission (Form 5110.38) before you can continue producing this product. A new version will be created.
            </p>
            <Input label="Describe the change (optional)" value={changeDesc} onChange={(e) => setChangeDesc(e.target.value)} placeholder="e.g. Added natural color" />
            <div className="flex gap-2">
              <Button onClick={() => confirmVersioning(versionModal, {})} size="sm">Create new version</Button>
              <Button variant="secondary" size="sm" onClick={() => setVersionModal(null)}>Cancel</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
