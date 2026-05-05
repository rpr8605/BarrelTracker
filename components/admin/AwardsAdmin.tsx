'use client'
import { useState } from 'react'

interface Props {
  missingCategories: string[]
  year: number
}

export function AwardsAdmin({ missingCategories, year }: Props) {
  const [creating, setCreating] = useState(false)
  const [msg, setMsg] = useState('')

  async function createSeason() {
    setCreating(true)
    setMsg('')
    const res = await fetch('/api/admin/awards/create-season', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ year }),
    })
    const data = await res.json()
    setMsg(data.message ?? (res.ok ? 'Season created' : 'Failed'))
    setCreating(false)
  }

  if (missingCategories.length === 0) return <span className="text-xs text-[var(--color-text-muted)]">Season active</span>

  return (
    <div className="flex items-center gap-3">
      {msg && <span className="text-xs text-[var(--color-text-muted)]">{msg}</span>}
      <button
        onClick={createSeason}
        disabled={creating}
        className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-all disabled:opacity-50 min-h-[44px]"
      >
        {creating ? 'Creating...' : `Create ${year} season`}
      </button>
    </div>
  )
}
