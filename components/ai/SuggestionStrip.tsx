'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import type { Barrel } from '@/types/database'

export function SuggestionStrip({ barrels }: { barrels: Barrel[] }) {
  const [insight, setInsight] = useState<string>('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!barrels.length) { setLoading(false); return }

    fetch('/api/ai/search-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: 'weekly tasting suggestions', barrelCount: barrels.length }),
    })
      .then((r) => r.json())
      .then((d) => setInsight(d.insight || ''))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [barrels.length])

  const top = barrels
    .filter((b) => b.status === 'ready' || (b.profile_match_score || 0) > 70)
    .sort((a, b) => (b.profile_match_score || 0) - (a.profile_match_score || 0))
    .slice(0, 3)

  if (!top.length) return null

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-primary">✦</span>
        <h3 className="text-sm font-medium">Worth tasting this week</h3>
      </div>

      {loading ? (
        <div className="skeleton h-4 w-3/4" />
      ) : insight ? (
        <p className="text-xs text-[var(--color-text-muted)]">{insight}</p>
      ) : null}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {top.map((barrel) => (
          <Link key={barrel.id} href={`/barrels/${barrel.id}`} className="flex-shrink-0">
            <div className="card px-3 py-2 min-w-[140px] hover:border-primary/40 transition-all">
              <div className="font-medium text-sm">{barrel.barrel_number}</div>
              <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{barrel.mash_bill || 'No details'}</div>
              {barrel.profile_match_score && (
                <div className="text-xs text-primary mt-1">{barrel.profile_match_score}% match</div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
