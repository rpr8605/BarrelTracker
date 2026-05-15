'use client'
import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase'
import { BarrelCard } from '@/components/barrels/BarrelCard'
import type { Barrel } from '@/types/database'

const QUICK_TAGS = ['Wheat', 'High Rye', 'MGP', 'Buffalo Trace', 'Port Finish', 'Honey', 'Ready', 'Vanilla', 'Heaven Hill', 'Sherry Finish', 'Wheated Bourbon', 'Dark Chocolate']

export default function SearchPage() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Barrel[]>([])
  const [insight, setInsight] = useState('')
  const [loading, setLoading] = useState(false)
  const [insightLoading, setInsightLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  async function search(q: string) {
    if (!q.trim()) { setResults([]); setInsight(''); return }
    setLoading(true)
    setInsightLoading(true)

    const supabase = createClient()
    const { data } = await supabase
      .from('barrels')
      .select('*')
      .or(`barrel_number.ilike.%${q}%,mash_bill.ilike.%${q}%,distillery_source.ilike.%${q}%,finish_type.ilike.%${q}%,notes.ilike.%${q}%`)
      .limit(20)

    setResults((data || []) as Barrel[])
    setLoading(false)

    fetch('/api/ai/search-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: q }),
    })
      .then((r) => r.json())
      .then((d) => setInsight(d.insight || ''))
      .catch(() => {})
      .finally(() => setInsightLoading(false))
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 350)
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [query])

  function highlight(text: string, q: string): string {
    if (!q) return text
    return text.replace(new RegExp(`(${q})`, 'gi'), '<mark class="bg-primary/20 text-primary rounded px-0.5">$1</mark>')
  }

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">◎</span>
        <input
          autoFocus
          data-tour="smart-search-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search barrels, flavors, sources..."
          className="w-full pl-9 pr-4 py-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] outline-none focus:border-primary text-base min-h-[52px]"
        />
      </div>

      {!query && (
        <div className="flex flex-wrap gap-2">
          {QUICK_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setQuery(tag)}
              className="px-3 py-1.5 rounded-full text-sm bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-primary/10 hover:text-primary transition-all min-h-[36px]"
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      {query && (
        <>
          {insightLoading ? (
            <div className="card p-3 flex items-center gap-2">
              <span className="text-primary animate-pulse">✦</span>
              <div className="skeleton h-4 flex-1" />
            </div>
          ) : insight ? (
            <div className="card p-3 flex items-start gap-2">
              <span className="text-primary mt-0.5">✦</span>
              <p className="text-sm text-[var(--color-text-secondary)]">{insight}</p>
            </div>
          ) : null}

          {loading ? (
            <div className="text-sm text-[var(--color-text-muted)] text-center py-4">Searching…</div>
          ) : (
            <>
              <div className="text-xs text-[var(--color-text-muted)]">{results.length} results for &quot;{query}&quot;</div>
              <div className="space-y-2">
                {results.map((barrel) => (
                  <BarrelCard key={barrel.id} barrel={barrel} />
                ))}
              </div>
              {results.length === 0 && (
                <div className="text-center py-8 text-[var(--color-text-muted)] text-sm">No barrels match &quot;{query}&quot;</div>
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}
