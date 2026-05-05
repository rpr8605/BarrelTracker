'use client'
import { useState, useCallback } from 'react'
import { CrmClientDrawer } from './CrmClientDrawer'

export type CrmStage = 'PROSPECT' | 'DEMO_SCHEDULED' | 'PROPOSAL_SENT' | 'NEGOTIATION' | 'ONBOARDING' | 'ACTIVE' | 'CHURNED'

export interface CrmClient {
  id: string
  contact_name: string
  distillery_name: string
  email: string | null
  phone: string | null
  stage: CrmStage
  notes: string | null
  mrr_cents: number | null
  next_follow_up_at: string | null
  distillery_id: string | null
  created_at: string
  updated_at: string
}

const STAGES: { key: CrmStage; label: string; color: string }[] = [
  { key: 'PROSPECT', label: 'Prospect', color: 'border-gray-300' },
  { key: 'DEMO_SCHEDULED', label: 'Demo', color: 'border-blue-300' },
  { key: 'PROPOSAL_SENT', label: 'Proposal', color: 'border-yellow-300' },
  { key: 'NEGOTIATION', label: 'Negotiating', color: 'border-orange-300' },
  { key: 'ONBOARDING', label: 'Onboarding', color: 'border-purple-300' },
  { key: 'ACTIVE', label: 'Active', color: 'border-green-400' },
  { key: 'CHURNED', label: 'Churned', color: 'border-red-300' },
]

export function CrmKanban({ initialClients }: { initialClients: CrmClient[] }) {
  const [clients, setClients] = useState(initialClients)
  const [selected, setSelected] = useState<CrmClient | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)

  const byStage = useCallback(
    (stage: CrmStage) => clients.filter((c) => c.stage === stage),
    [clients]
  )

  async function moveClient(id: string, stage: CrmStage) {
    setClients((prev) => prev.map((c) => (c.id === id ? { ...c, stage } : c)))
    await fetch('/api/admin/crm/update', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, stage }),
    })
  }

  function isOverdue(client: CrmClient) {
    if (!client.next_follow_up_at) return false
    return new Date(client.next_follow_up_at) < new Date()
  }

  return (
    <>
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-3 min-w-max">
          {STAGES.map(({ key, label, color }) => (
            <div
              key={key}
              className={`w-56 flex-shrink-0 rounded-xl border-2 ${color} bg-[var(--color-surface)] p-3`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault()
                if (dragging) moveClient(dragging, key)
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">{label}</span>
                <span className="text-xs text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)] px-1.5 py-0.5 rounded-full">
                  {byStage(key).length}
                </span>
              </div>
              <div className="space-y-2">
                {byStage(key).map((client) => (
                  <div
                    key={client.id}
                    draggable
                    onDragStart={() => setDragging(client.id)}
                    onDragEnd={() => setDragging(null)}
                    onClick={() => setSelected(client)}
                    className="bg-[var(--color-bg)] rounded-lg p-3 cursor-pointer hover:shadow-sm transition-shadow border border-[var(--color-border)]"
                  >
                    <div className="font-medium text-sm text-[var(--color-text)] truncate">{client.distillery_name}</div>
                    <div className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{client.contact_name}</div>
                    {client.mrr_cents && (
                      <div className="text-xs text-success mt-1">${(client.mrr_cents / 100).toFixed(0)}/mo</div>
                    )}
                    {client.next_follow_up_at && (
                      <div className={`text-xs mt-1 ${isOverdue(client) ? 'text-red-500 font-medium' : 'text-[var(--color-text-muted)]'}`}>
                        Follow up: {new Date(client.next_follow_up_at).toLocaleDateString()}
                      </div>
                    )}
                    <div className="flex gap-1 mt-2">
                      {client.email && (
                        <a
                          href={`mailto:${client.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-primary hover:underline"
                        >
                          Email
                        </a>
                      )}
                      {client.phone && (
                        <a
                          href={`tel:${client.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs text-primary hover:underline ml-2"
                        >
                          Call
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {selected && (
        <CrmClientDrawer
          client={selected}
          onClose={() => setSelected(null)}
          onUpdate={(updated) => {
            setClients((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
            setSelected(updated)
          }}
        />
      )}
    </>
  )
}
