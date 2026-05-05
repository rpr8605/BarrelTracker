'use client'
import { useState } from 'react'

export function DemoActions({ demoDistilleryId }: { demoDistilleryId: string | null }) {
  const [resetting, setResetting] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [seeding, setSeeding] = useState(false)
  const [msg, setMsg] = useState('')

  async function resetDemo() {
    setResetting(true)
    setMsg('')
    const res = await fetch('/api/admin/demo/reset', { method: 'POST' })
    const data = await res.json()
    setMsg(data.message ?? (res.ok ? 'Demo reset complete' : 'Reset failed'))
    setResetting(false)
    setConfirming(false)
  }

  async function seedDemo() {
    setSeeding(true)
    setMsg('')
    const res = await fetch('/api/admin/demo/seed', { method: 'POST' })
    const data = await res.json()
    setMsg(data.message ?? (res.ok ? 'Demo seeded' : 'Seed failed'))
    setSeeding(false)
  }

  async function impersonateDemo() {
    if (!demoDistilleryId) return
    await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distilleryId: demoDistilleryId, distilleryName: 'Ridgeline Spirits (Demo)' }),
    })
    window.location.href = '/dashboard'
  }

  return (
    <div className="space-y-3">
      {msg && (
        <div className="px-4 py-3 rounded-lg bg-[var(--color-bg-secondary)] text-sm text-[var(--color-text)]">{msg}</div>
      )}

      <div className="flex flex-wrap gap-3">
        {!demoDistilleryId && (
          <button
            onClick={seedDemo}
            disabled={seeding}
            className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-all disabled:opacity-50 min-h-[44px]"
          >
            {seeding ? 'Seeding...' : 'Seed demo data'}
          </button>
        )}

        {demoDistilleryId && (
          <>
            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-all min-h-[44px]"
              >
                Reset to clean state
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-sm text-[var(--color-text-muted)]">Are you sure?</span>
                <button
                  onClick={resetDemo}
                  disabled={resetting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-all disabled:opacity-50 min-h-[44px]"
                >
                  {resetting ? 'Resetting...' : 'Yes, reset'}
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="px-4 py-2 border border-[var(--color-border)] rounded-lg text-sm min-h-[44px]"
                >
                  Cancel
                </button>
              </div>
            )}

            <button
              onClick={impersonateDemo}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-all min-h-[44px]"
            >
              Open demo dashboard →
            </button>
          </>
        )}
      </div>
    </div>
  )
}
