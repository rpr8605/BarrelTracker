'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

type Pref = { email_enabled: boolean; push_enabled: boolean; permit_types: string[] }
type Delivery = {
  id: string
  delivered_at: string
  read_at: string | null
  regulatory_alerts: { id: string; title: string; summary: string; action_required: string | null; source_url: string; effective_date: string | null }
}

const PERMIT_TYPES = ['DSP', 'Winery', 'Brewery']

export default function AlertsSettingsPage() {
  const [pref, setPref] = useState<Pref>({ email_enabled: true, push_enabled: true, permit_types: ['DSP'] })
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/alerts/preferences').then((r) => r.json()).then((r) => setPref(r.pref))
    fetch('/api/alerts').then((r) => r.json()).then((r) => setDeliveries(r.deliveries || []))
  }, [])

  async function save() {
    setSaving(true)
    await fetch('/api/alerts/preferences', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(pref) })
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-medium">Regulatory Alerts</h1>
      <Card>
        <div className="text-sm font-medium mb-3">Preferences</div>
        <div className="space-y-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pref.email_enabled} onChange={(e) => setPref({ ...pref, email_enabled: e.target.checked })} />
            Email alerts
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={pref.push_enabled} onChange={(e) => setPref({ ...pref, push_enabled: e.target.checked })} />
            Push notifications
          </label>
          <div>
            <div className="text-sm font-medium mb-1">Permit types</div>
            <div className="flex gap-2 flex-wrap">
              {PERMIT_TYPES.map((t) => {
                const on = pref.permit_types.includes(t)
                return (
                  <button
                    key={t}
                    onClick={() => setPref({ ...pref, permit_types: on ? pref.permit_types.filter((x) => x !== t) : [...pref.permit_types, t] })}
                    className={`px-3 py-1.5 rounded-full text-sm border ${on ? 'bg-primary text-white border-primary' : 'border-[var(--color-border)]'}`}
                  >
                    {t}
                  </button>
                )
              })}
            </div>
          </div>
          <Button onClick={save} loading={saving}>Save preferences</Button>
        </div>
      </Card>

      <Card>
        <div className="text-sm font-medium mb-3">Past alerts</div>
        <div className="space-y-3">
          {deliveries.map((d) => (
            <div key={d.id} className="p-3 border border-[var(--color-border)] rounded-lg">
              <div className="flex items-baseline justify-between gap-3">
                <div className="font-medium text-sm">{d.regulatory_alerts.title}</div>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${d.read_at ? 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]' : 'bg-primary/10 text-primary'}`}>
                  {d.read_at ? 'read' : 'new'}
                </span>
              </div>
              <div className="text-xs text-[var(--color-text-muted)] mt-1">{d.regulatory_alerts.summary}</div>
              {d.regulatory_alerts.action_required && (
                <div className="text-xs mt-2 p-2 bg-amber-500/10 border-l-2 border-primary text-[var(--color-text)]">
                  <b>Action:</b> {d.regulatory_alerts.action_required}
                </div>
              )}
              <div className="flex justify-between mt-2 text-xs">
                <span className="text-[var(--color-text-muted)]">{new Date(d.delivered_at).toLocaleDateString()}{d.regulatory_alerts.effective_date && ` · Effective ${d.regulatory_alerts.effective_date}`}</span>
                <a href={d.regulatory_alerts.source_url} target="_blank" rel="noreferrer" className="text-primary">Read on FR →</a>
              </div>
            </div>
          ))}
          {deliveries.length === 0 && <div className="text-sm text-[var(--color-text-muted)] text-center py-4">No alerts yet.</div>}
        </div>
      </Card>
    </div>
  )
}
