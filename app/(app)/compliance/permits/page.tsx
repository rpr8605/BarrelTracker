'use client'
import { useEffect, useState, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Select } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase'
import { getMyDistilleryId } from '@/lib/distillery'
import { formatDate } from '@/lib/utils'

type Tab = 'documents' | 'counterparties' | 'alerts'

interface DspDocument {
  id: string; distillery_id: string; document_type: string; document_number: string | null
  title: string; issue_date: string | null; expiration_date: string | null
  issuing_authority: string; status: string; notes: string | null
}

interface Counterparty {
  id: string; counterparty_name: string; dsp_number: string
  address: string | null; contact_name: string | null; contact_email: string | null; contact_phone: string | null
}

interface Alert {
  id: string; alert_type: string; title: string; description: string | null
  status: string; severity: string; created_at: string
}

const DOC_TYPE_LABELS: Record<string, string> = {
  basic_permit: 'Basic Permit', dsp_registration: 'DSP Registration',
  operating_bond: 'Operating Bond', tib_bond: 'TIB Bond',
  formula_approval: 'Formula Approval', label_approval: 'Label Approval', other: 'Other',
}

const SEVERITY_COLOR = { info: 'bg-blue-500/10 text-blue-400', warning: 'bg-amber-500/10 text-amber-400', critical: 'bg-red-500/10 text-red-400' }
const STATUS_COLOR = { active: 'bg-green-500/10 text-green-400', expired: 'bg-red-500/10 text-red-400', superseded: 'bg-gray-500/10 text-gray-400', pending: 'bg-amber-500/10 text-amber-400' }

export default function PermitsPage() {
  const [tab, setTab] = useState<Tab>('documents')
  const [distilleryId, setDistilleryId] = useState<string | null>(null)
  const [documents, setDocuments] = useState<DspDocument[]>([])
  const [counterparties, setCounterparties] = useState<Counterparty[]>([])
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [loading, setLoading] = useState(true)

  const [showDocForm, setShowDocForm] = useState(false)
  const [docForm, setDocForm] = useState({ document_type: 'dsp_registration', title: '', document_number: '', issue_date: '', expiration_date: '', issuing_authority: 'TTB', notes: '' })
  const [docSaving, setDocSaving] = useState(false)

  const [showCpForm, setShowCpForm] = useState(false)
  const [cpForm, setCpForm] = useState({ counterparty_name: '', dsp_number: '', address: '', contact_name: '', contact_email: '', contact_phone: '' })
  const [cpSaving, setCpSaving] = useState(false)

  const load = useCallback(async (id: string) => {
    const [docs, cps, als] = await Promise.all([
      fetch(`/api/permits?distillery_id=${id}`).then((r) => r.json()),
      fetch(`/api/tib/counterparties?distillery_id=${id}`).then((r) => r.json()),
      fetch(`/api/compliance/amendment-alerts?distillery_id=${id}`).then((r) => r.json()),
    ])
    setDocuments(Array.isArray(docs) ? docs : [])
    setCounterparties(Array.isArray(cps) ? cps : [])
    setAlerts(Array.isArray(als) ? als : [])
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

  async function saveDocument() {
    if (!distilleryId || !docForm.title) return
    setDocSaving(true)
    const res = await fetch('/api/permits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distillery_id: distilleryId, ...docForm, document_number: docForm.document_number || null, issue_date: docForm.issue_date || null, expiration_date: docForm.expiration_date || null, notes: docForm.notes || null }),
    }).then((r) => r.json())
    if (res.id) { setDocuments((p) => [res, ...p]); setShowDocForm(false); setDocForm({ document_type: 'dsp_registration', title: '', document_number: '', issue_date: '', expiration_date: '', issuing_authority: 'TTB', notes: '' }) }
    setDocSaving(false)
  }

  async function deleteDocument(id: string) {
    await fetch(`/api/permits/${id}`, { method: 'DELETE' })
    setDocuments((p) => p.filter((d) => d.id !== id))
  }

  async function saveCounterparty() {
    if (!distilleryId || !cpForm.counterparty_name || !cpForm.dsp_number) return
    setCpSaving(true)
    const res = await fetch('/api/tib/counterparties', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distillery_id: distilleryId, ...cpForm, address: cpForm.address || null, contact_name: cpForm.contact_name || null, contact_email: cpForm.contact_email || null, contact_phone: cpForm.contact_phone || null }),
    }).then((r) => r.json())
    if (res.id) { setCounterparties((p) => [...p, res].sort((a, b) => a.counterparty_name.localeCompare(b.counterparty_name))); setShowCpForm(false); setCpForm({ counterparty_name: '', dsp_number: '', address: '', contact_name: '', contact_email: '', contact_phone: '' }) }
    setCpSaving(false)
  }

  async function acknowledgeAlert(id: string) {
    const res = await fetch('/api/compliance/amendment-alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'acknowledged' }) }).then((r) => r.json())
    if (res.id) setAlerts((p) => p.map((a) => a.id === id ? { ...a, status: 'acknowledged' } : a))
  }

  async function resolveAlert(id: string) {
    const res = await fetch('/api/compliance/amendment-alerts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, status: 'resolved' }) }).then((r) => r.json())
    if (res.id) setAlerts((p) => p.filter((a) => a.id !== id))
  }

  if (loading) return <div className="text-sm text-[var(--color-text-muted)] p-4">Loading permits…</div>

  const pendingAlerts = alerts.filter((a) => a.status === 'pending')

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-medium text-lg">Permits & Bonds</h1>
          <p className="text-sm text-[var(--color-text-muted)]">DSP documents, TIB counterparties, and compliance alerts</p>
        </div>
        {pendingAlerts.length > 0 && (
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">{pendingAlerts.length}</span>
        )}
      </div>

      <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-secondary)]">
        {(['documents', 'counterparties', 'alerts'] as Tab[]).map((t) => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 px-3 py-1.5 text-sm rounded-md transition-all ${tab === t ? 'bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm' : 'text-[var(--color-text-muted)]'}`}>
            {t === 'documents' ? 'Documents' : t === 'counterparties' ? 'Counterparties' : `Alerts${pendingAlerts.length > 0 ? ` (${pendingAlerts.length})` : ''}`}
          </button>
        ))}
      </div>

      {tab === 'documents' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[var(--color-text-muted)]">DSP registrations, operating bonds, TIB bonds, and other official documents</p>
            <Button size="sm" onClick={() => setShowDocForm(!showDocForm)}>{showDocForm ? 'Cancel' : '+ Add document'}</Button>
          </div>

          {showDocForm && (
            <Card className="space-y-3">
              <p className="text-sm font-medium">Add DSP document</p>
              <div className="grid grid-cols-2 gap-3">
                <Select label="Document type" value={docForm.document_type} onChange={(e) => setDocForm((f) => ({ ...f, document_type: e.target.value }))}>
                  {Object.entries(DOC_TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
                <Input label="Title *" value={docForm.title} onChange={(e) => setDocForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. DSP-KY-1234 Registration" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Document number" value={docForm.document_number} onChange={(e) => setDocForm((f) => ({ ...f, document_number: e.target.value }))} placeholder="TTB-issued number" />
                <Input label="Issuing authority" value={docForm.issuing_authority} onChange={(e) => setDocForm((f) => ({ ...f, issuing_authority: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Issue date" type="date" value={docForm.issue_date} onChange={(e) => setDocForm((f) => ({ ...f, issue_date: e.target.value }))} />
                <Input label="Expiration date" type="date" value={docForm.expiration_date} onChange={(e) => setDocForm((f) => ({ ...f, expiration_date: e.target.value }))} />
              </div>
              <Input label="Notes" value={docForm.notes} onChange={(e) => setDocForm((f) => ({ ...f, notes: e.target.value }))} />
              <Button onClick={saveDocument} loading={docSaving} disabled={!docForm.title}>Save document</Button>
            </Card>
          )}

          {documents.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No documents on file. Add your DSP registration, operating bond, and TIB bond here.</p>}

          {documents.map((doc) => {
            const daysLeft = doc.expiration_date ? Math.ceil((new Date(doc.expiration_date).getTime() - Date.now()) / 86_400_000) : null
            return (
              <Card key={doc.id} className="space-y-1.5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-sm">{doc.title}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{DOC_TYPE_LABELS[doc.document_type]}{doc.document_number ? ` · ${doc.document_number}` : ''}</div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[doc.status as keyof typeof STATUS_COLOR] ?? ''}`}>{doc.status}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)]">
                  {doc.issue_date && <span>Issued: {formatDate(doc.issue_date)}</span>}
                  {doc.expiration_date && (
                    <span className={daysLeft !== null && daysLeft <= 90 ? (daysLeft <= 30 ? 'text-red-400' : 'text-amber-400') : ''}>
                      Expires: {formatDate(doc.expiration_date)}{daysLeft !== null && daysLeft <= 90 ? ` (${daysLeft}d)` : ''}
                    </span>
                  )}
                </div>
                {doc.notes && <p className="text-xs text-[var(--color-text-muted)]">{doc.notes}</p>}
                <div className="flex justify-end">
                  <Button size="sm" variant="secondary" onClick={() => deleteDocument(doc.id)}>Remove</Button>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'counterparties' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <p className="text-xs text-[var(--color-text-muted)]">DSPs you send or receive TIB transfers with. Both DSP numbers are required on every TIB record per 27 CFR 19.402.</p>
            <Button size="sm" onClick={() => setShowCpForm(!showCpForm)}>{showCpForm ? 'Cancel' : '+ Add counterparty'}</Button>
          </div>

          {showCpForm && (
            <Card className="space-y-3">
              <p className="text-sm font-medium">Add TIB counterparty</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Distillery name *" value={cpForm.counterparty_name} onChange={(e) => setCpForm((f) => ({ ...f, counterparty_name: e.target.value }))} placeholder="e.g. Heaven Hill Distilleries" />
                <Input label="DSP number *" value={cpForm.dsp_number} onChange={(e) => setCpForm((f) => ({ ...f, dsp_number: e.target.value }))} placeholder="e.g. DSP-KY-20009" />
              </div>
              <Input label="Address" value={cpForm.address} onChange={(e) => setCpForm((f) => ({ ...f, address: e.target.value }))} />
              <div className="grid grid-cols-3 gap-3">
                <Input label="Contact name" value={cpForm.contact_name} onChange={(e) => setCpForm((f) => ({ ...f, contact_name: e.target.value }))} />
                <Input label="Email" type="email" value={cpForm.contact_email} onChange={(e) => setCpForm((f) => ({ ...f, contact_email: e.target.value }))} />
                <Input label="Phone" value={cpForm.contact_phone} onChange={(e) => setCpForm((f) => ({ ...f, contact_phone: e.target.value }))} />
              </div>
              <Button onClick={saveCounterparty} loading={cpSaving} disabled={!cpForm.counterparty_name || !cpForm.dsp_number}>Save counterparty</Button>
            </Card>
          )}

          {counterparties.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No counterparties on file. Add DSPs you regularly transfer spirits with.</p>}

          {counterparties.map((cp) => (
            <Card key={cp.id} className="text-sm">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{cp.counterparty_name}</div>
                  <div className="text-xs text-[var(--color-text-muted)] font-mono">{cp.dsp_number}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={async () => {
                  await fetch(`/api/tib/counterparties?id=${cp.id}`, { method: 'DELETE' })
                  setCounterparties((p) => p.filter((c) => c.id !== cp.id))
                }}>Remove</Button>
              </div>
              {(cp.contact_name || cp.contact_email || cp.contact_phone) && (
                <div className="text-xs text-[var(--color-text-muted)] mt-1">
                  {[cp.contact_name, cp.contact_email, cp.contact_phone].filter(Boolean).join(' · ')}
                </div>
              )}
              {cp.address && <div className="text-xs text-[var(--color-text-muted)]">{cp.address}</div>}
            </Card>
          ))}
        </div>
      )}

      {tab === 'alerts' && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-text-muted)]">Compliance action items that require your attention. Resolve each after taking the appropriate action.</p>

          {alerts.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No compliance alerts.</p>}

          {alerts.map((alert) => (
            <Card key={alert.id} className={`border-l-4 ${alert.severity === 'critical' ? 'border-l-red-500' : alert.severity === 'warning' ? 'border-l-amber-500' : 'border-l-blue-500'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${SEVERITY_COLOR[alert.severity as keyof typeof SEVERITY_COLOR]}`}>{alert.severity.toUpperCase()}</span>
                    <span className="text-sm font-medium">{alert.title}</span>
                  </div>
                  {alert.description && <p className="text-xs text-[var(--color-text-muted)]">{alert.description}</p>}
                  <p className="text-xs text-[var(--color-text-muted)]">{formatDate(alert.created_at)}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  {alert.status === 'pending' && (
                    <Button size="sm" variant="secondary" onClick={() => acknowledgeAlert(alert.id)}>Acknowledge</Button>
                  )}
                  <Button size="sm" variant="secondary" onClick={() => resolveAlert(alert.id)}>Resolve</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
