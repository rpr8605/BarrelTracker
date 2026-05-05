'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { formatDate, formatCurrency } from '@/lib/utils'

interface DropEvent {
  id: string
  title: string
  description: string | null
  barrel_id: string | null
  batch_id: string | null
  total_bottles: number
  bottles_remaining: number
  price_per_bottle: number
  opens_at: string | null
  closes_at: string | null
  status: 'waitlist' | 'open' | 'closed' | 'sold_out'
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  waitlist: 'bg-yellow-500/10 text-yellow-400',
  open: 'bg-green-500/10 text-green-400',
  closed: 'bg-white/5 text-[#f5f0e8]/30',
  sold_out: 'bg-red-500/10 text-red-400',
}

const STATUS_LABELS: Record<string, string> = {
  waitlist: 'Waitlist',
  open: 'Live',
  closed: 'Closed',
  sold_out: 'Sold Out',
}

const emptyForm = {
  title: '',
  description: '',
  barrel_id: '',
  batch_id: '',
  total_bottles: '',
  price_per_bottle: '',
  opens_at: '',
  closes_at: '',
}

export default function DropsPage() {
  const [drops, setDrops] = useState<DropEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editDrop, setEditDrop] = useState<DropEvent | null>(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchDrops = useCallback(async () => {
    const res = await fetch('/api/distillery/drops')
    if (res.ok) setDrops(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchDrops() }, [fetchDrops])

  function openCreate() {
    setEditDrop(null)
    setForm(emptyForm)
    setShowModal(true)
  }

  function openEdit(drop: DropEvent) {
    setEditDrop(drop)
    setForm({
      title: drop.title,
      description: drop.description || '',
      barrel_id: drop.barrel_id || '',
      batch_id: drop.batch_id || '',
      total_bottles: String(drop.total_bottles),
      price_per_bottle: String(drop.price_per_bottle),
      opens_at: drop.opens_at ? drop.opens_at.slice(0, 16) : '',
      closes_at: drop.closes_at ? drop.closes_at.slice(0, 16) : '',
    })
    setShowModal(true)
  }

  async function saveDrop() {
    setSaving(true)
    try {
      const body = {
        ...(editDrop ? { id: editDrop.id } : {}),
        title: form.title,
        description: form.description || null,
        barrel_id: form.barrel_id || null,
        batch_id: form.batch_id || null,
        total_bottles: Number(form.total_bottles),
        price_per_bottle: Number(form.price_per_bottle),
        opens_at: form.opens_at ? new Date(form.opens_at).toISOString() : null,
        closes_at: form.closes_at ? new Date(form.closes_at).toISOString() : null,
      }

      const res = await fetch('/api/distillery/drops', {
        method: editDrop ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setShowModal(false)
        fetchDrops()
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteDrop(id: string) {
    setDeleting(id)
    await fetch(`/api/distillery/drops?id=${id}`, { method: 'DELETE' })
    setDeleting(null)
    fetchDrops()
  }

  function setStatus(drop: DropEvent, status: DropEvent['status']) {
    fetch('/api/distillery/drops', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: drop.id, status }),
    }).then(() => fetchDrops())
  }

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-6 h-6 border-2 border-[#BA7517] border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="space-y-5 max-w-2xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-medium text-lg">Limited Releases</h1>
        <Button size="sm" onClick={openCreate}>+ New Drop</Button>
      </div>

      {drops.length === 0 && (
        <Card>
          <p className="text-sm text-[var(--color-text-muted)] text-center py-6">
            No releases yet. Create your first limited drop.
          </p>
        </Card>
      )}

      {drops.map((drop) => (
        <Card key={drop.id} className="space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="font-medium text-sm">{drop.title}</h2>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[drop.status] || 'bg-white/5 text-[#f5f0e8]/40'}`}>
                  {STATUS_LABELS[drop.status] || drop.status}
                </span>
              </div>
              {drop.description && (
                <p className="text-xs text-[var(--color-text-muted)] mt-1 line-clamp-2">{drop.description}</p>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => openEdit(drop)}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                Edit
              </button>
              <button
                onClick={() => deleteDrop(drop.id)}
                disabled={deleting === drop.id}
                className="text-xs text-red-400/60 hover:text-red-400 transition-colors"
              >
                {deleting === drop.id ? '…' : 'Delete'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <p className="text-[var(--color-text-muted)]">Price</p>
              <p className="font-medium">{formatCurrency(drop.price_per_bottle)}</p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)]">Remaining</p>
              <p className="font-medium">{drop.bottles_remaining} / {drop.total_bottles}</p>
            </div>
            <div>
              <p className="text-[var(--color-text-muted)]">Opens</p>
              <p className="font-medium">{drop.opens_at ? formatDate(drop.opens_at) : '—'}</p>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            {drop.status !== 'open' && drop.status !== 'sold_out' && (
              <button
                onClick={() => setStatus(drop, 'open')}
                className="text-xs text-green-400 hover:text-green-300 transition-colors"
              >
                Open now
              </button>
            )}
            {drop.status === 'open' && (
              <button
                onClick={() => setStatus(drop, 'closed')}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                Close
              </button>
            )}
            <a
              href={`/drops/${drop.id}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#BA7517] hover:underline"
            >
              Public page →
            </a>
          </div>
        </Card>
      ))}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/70 px-4 pb-4 md:pb-0">
          <div className="bg-[#1a1410] border border-white/10 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="p-5 space-y-4">
              <h2 className="font-medium">{editDrop ? 'Edit Release' : 'New Release'}</h2>

              <Input
                label="Title"
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Barrel #42 — Single Cask Release"
              />
              <Input
                label="Description (optional)"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Short tasting note or release story"
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Total bottles"
                  type="number"
                  value={form.total_bottles}
                  onChange={(e) => setForm((f) => ({ ...f, total_bottles: e.target.value }))}
                  placeholder="150"
                />
                <Input
                  label="Price per bottle ($)"
                  type="number"
                  step="0.01"
                  value={form.price_per_bottle}
                  onChange={(e) => setForm((f) => ({ ...f, price_per_bottle: e.target.value }))}
                  placeholder="89.99"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Opens at *"
                  type="datetime-local"
                  value={form.opens_at}
                  onChange={(e) => setForm((f) => ({ ...f, opens_at: e.target.value }))}
                />
                <Input
                  label="Closes at (optional)"
                  type="datetime-local"
                  value={form.closes_at}
                  onChange={(e) => setForm((f) => ({ ...f, closes_at: e.target.value }))}
                />
              </div>
              <Input
                label="Barrel ID (optional)"
                value={form.barrel_id}
                onChange={(e) => setForm((f) => ({ ...f, barrel_id: e.target.value }))}
                placeholder="UUID of linked barrel"
              />
              <Input
                label="Batch ID (optional)"
                value={form.batch_id}
                onChange={(e) => setForm((f) => ({ ...f, batch_id: e.target.value }))}
                placeholder="UUID of linked batch"
              />

              <div className="flex gap-3 pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  className="flex-1 bg-[#BA7517] hover:bg-[#a36614] text-white"
                  loading={saving}
                  onClick={saveDrop}
                  disabled={!form.title || !form.total_bottles || !form.price_per_bottle || !form.opens_at}
                >
                  {editDrop ? 'Save' : 'Create'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
