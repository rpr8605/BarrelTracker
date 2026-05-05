'use client'
import { useState } from 'react'
import type { CrmClient } from './CrmKanban'

interface Props {
  client: CrmClient
  onClose: () => void
  onUpdate: (updated: CrmClient) => void
}

export function CrmClientDrawer({ client, onClose, onUpdate }: Props) {
  const [notes, setNotes] = useState(client.notes ?? '')
  const [saving, setSaving] = useState(false)

  async function saveNotes() {
    setSaving(true)
    const res = await fetch('/api/admin/crm/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: client.id, notes }),
    })
    if (res.ok) {
      onUpdate({ ...client, notes })
    }
    setSaving(false)
  }

  async function activateImpersonation() {
    if (!client.distillery_id) return
    await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distilleryId: client.distillery_id, distilleryName: client.distillery_name }),
    })
    window.location.href = '/dashboard'
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end" onClick={onClose}>
      <div
        className="w-full max-w-md h-full bg-[var(--color-surface)] border-l border-[var(--color-border)] p-6 overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-[var(--color-text)]">{client.distillery_name}</h2>
            <p className="text-sm text-[var(--color-text-muted)]">{client.contact_name}</p>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] text-xl">×</button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            {client.email && (
              <div>
                <div className="text-xs text-[var(--color-text-muted)] mb-0.5">Email</div>
                <a href={`mailto:${client.email}`} className="text-primary hover:underline truncate block">{client.email}</a>
              </div>
            )}
            {client.phone && (
              <div>
                <div className="text-xs text-[var(--color-text-muted)] mb-0.5">Phone</div>
                <a href={`tel:${client.phone}`} className="text-primary hover:underline">{client.phone}</a>
              </div>
            )}
            <div>
              <div className="text-xs text-[var(--color-text-muted)] mb-0.5">Stage</div>
              <span className="font-medium text-[var(--color-text)]">{client.stage}</span>
            </div>
            {client.mrr_cents && (
              <div>
                <div className="text-xs text-[var(--color-text-muted)] mb-0.5">MRR</div>
                <span className="font-medium text-success">${(client.mrr_cents / 100).toFixed(0)}/mo</span>
              </div>
            )}
            {client.next_follow_up_at && (
              <div>
                <div className="text-xs text-[var(--color-text-muted)] mb-0.5">Follow up</div>
                <span className={new Date(client.next_follow_up_at) < new Date() ? 'text-red-500 font-medium' : 'text-[var(--color-text)]'}>
                  {new Date(client.next_follow_up_at).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>

          <div>
            <div className="text-xs text-[var(--color-text-muted)] mb-1">Notes</div>
            <textarea
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg)] p-3 text-sm text-[var(--color-text)] resize-none min-h-[120px] focus:outline-none focus:border-primary"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add notes about this client..."
            />
            <button
              onClick={saveNotes}
              disabled={saving}
              className="mt-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-all disabled:opacity-50 min-h-[44px]"
            >
              {saving ? 'Saving...' : 'Save notes'}
            </button>
          </div>

          {client.distillery_id && (
            <div className="pt-4 border-t border-[var(--color-border)]">
              <button
                onClick={activateImpersonation}
                className="w-full py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/5 transition-all min-h-[44px]"
              >
                View their dashboard →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
