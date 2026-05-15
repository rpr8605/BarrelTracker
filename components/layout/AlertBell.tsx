'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'

type Delivery = {
  id: string
  delivered_at: string
  read_at: string | null
  regulatory_alerts: {
    id: string
    title: string
    summary: string
    action_required: string | null
    source_url: string
  }
}

export function AlertBell() {
  const [open, setOpen] = useState(false)
  const [deliveries, setDeliveries] = useState<Delivery[]>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    fetch('/api/alerts?count=true').then((r) => r.json()).then((d) => setUnread(d.unread || 0)).catch(() => {})
  }, [])

  async function load() {
    const r = await fetch('/api/alerts').then((r) => r.json())
    setDeliveries(r.deliveries || [])
  }

  async function markRead(id: string) {
    await fetch(`/api/alerts/${id}/read`, { method: 'PATCH' })
    setDeliveries((prev) => prev.map((d) => d.id === id ? { ...d, read_at: new Date().toISOString() } : d))
    setUnread((u) => Math.max(0, u - 1))
  }

  return (
    <div className="relative">
      <button
        onClick={() => { setOpen(!open); if (!open) load() }}
        className="relative w-9 h-9 rounded-full hover:bg-[var(--color-bg-secondary)] flex items-center justify-center"
        aria-label="Regulatory alerts"
      >
        <span className="text-lg">🔔</span>
        {unread > 0 && (
          <span className="absolute -top-0.5 -right-0.5 inline-flex items-center justify-center min-w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 z-50 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg">
          <div className="p-3 border-b border-[var(--color-border)] flex items-center justify-between">
            <div className="text-sm font-medium">Regulatory alerts</div>
            <Link href="/settings/alerts" className="text-xs text-primary" onClick={() => setOpen(false)}>Settings</Link>
          </div>
          <div className="max-h-96 overflow-auto">
            {deliveries.slice(0, 5).map((d) => (
              <div key={d.id} className={`p-3 border-b border-[var(--color-border)]/40 ${d.read_at ? 'opacity-60' : ''}`}>
                <div className="font-medium text-sm">{d.regulatory_alerts.title}</div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{d.regulatory_alerts.summary}</div>
                <div className="flex justify-between items-center mt-2">
                  <a href={d.regulatory_alerts.source_url} target="_blank" rel="noreferrer" className="text-xs text-primary">Read article →</a>
                  {!d.read_at && <button onClick={() => markRead(d.id)} className="text-xs text-[var(--color-text-muted)] hover:text-primary">Mark read</button>}
                </div>
              </div>
            ))}
            {deliveries.length === 0 && <div className="p-6 text-center text-sm text-[var(--color-text-muted)]">No alerts yet.</div>}
          </div>
        </div>
      )}
    </div>
  )
}
