'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STAGES = ['PROSPECT', 'DEMO_SCHEDULED', 'PROPOSAL_SENT', 'NEGOTIATION', 'ONBOARDING', 'ACTIVE', 'CHURNED']

export default function NewClientPage() {
  const router = useRouter()
  const [form, setForm] = useState({
    contact_name: '',
    distillery_name: '',
    email: '',
    phone: '',
    stage: 'PROSPECT',
    notes: '',
    mrr_cents: '',
    next_follow_up_at: '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form.contact_name || !form.distillery_name) {
      setError('Name and distillery required')
      return
    }
    setSaving(true)
    const payload = {
      ...form,
      mrr_cents: form.mrr_cents ? parseInt(form.mrr_cents) * 100 : null,
      next_follow_up_at: form.next_follow_up_at || null,
    }
    const res = await fetch('/api/admin/crm/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) {
      router.push('/admin/clients')
    } else {
      const data = await res.json()
      setError(data.error ?? 'Save failed')
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-xl font-medium text-[var(--color-text)]">Add Prospect</h1>
      </div>
      <form onSubmit={save} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Distillery name *</label>
            <input
              value={form.distillery_name}
              onChange={(e) => setForm({ ...form, distillery_name: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-primary min-h-[44px]"
              required
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Contact name *</label>
            <input
              value={form.contact_name}
              onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-primary min-h-[44px]"
              required
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-primary min-h-[44px]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Phone</label>
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-primary min-h-[44px]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Stage</label>
            <select
              value={form.stage}
              onChange={(e) => setForm({ ...form, stage: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-primary min-h-[44px]"
            >
              {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">MRR ($/mo)</label>
            <input
              type="number"
              value={form.mrr_cents}
              onChange={(e) => setForm({ ...form, mrr_cents: e.target.value })}
              placeholder="e.g. 129"
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-primary min-h-[44px]"
            />
          </div>
          <div>
            <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Follow-up date</label>
            <input
              type="date"
              value={form.next_follow_up_at}
              onChange={(e) => setForm({ ...form, next_follow_up_at: e.target.value })}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-primary min-h-[44px]"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-[var(--color-text-muted)] mb-1 block">Notes</label>
          <textarea
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
            rows={4}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] px-3 py-2 text-sm text-[var(--color-text)] focus:outline-none focus:border-primary resize-none"
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-all disabled:opacity-50 min-h-[44px]"
          >
            {saving ? 'Saving...' : 'Add prospect'}
          </button>
          <a href="/admin/clients" className="px-6 py-2 border border-[var(--color-border)] rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-all min-h-[44px] flex items-center">
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
