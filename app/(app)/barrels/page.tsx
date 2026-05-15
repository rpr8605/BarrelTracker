'use client'
import { useState, useEffect, useCallback } from 'react'
import { BarrelCard, BarrelCardSkeleton } from '@/components/barrels/BarrelCard'
import { createClient } from '@/lib/supabase'
import type { Barrel } from '@/types/database'
import { useSearchParams } from 'next/navigation'

const STATUSES = ['All', 'Aging', 'Ready', 'Bottled', 'Dumped']
const GRAINS = ['All', 'Wheat', 'Rye', 'Corn', 'High Rye', 'Four Grain']
const SOURCES = ['All', 'MGP', 'Buffalo Trace', 'Heaven Hill', 'Willett', 'New Riff']
const FINISHES = ['All', 'Port', 'Sherry', 'Rum', 'Wine', 'None']

export default function BarrelsPage() {
  const searchParams = useSearchParams()
  const [barrels, setBarrels] = useState<Barrel[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(searchParams.get('status') || 'All')
  const [grain, setGrain] = useState('All')
  const [source, setSource] = useState('All')
  const [finish, setFinish] = useState('All')
  const [sort, setSort] = useState('entry_date')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('barrels').select('*')

    if (status !== 'All') q = q.eq('status', status.toLowerCase())
    if (grain !== 'All') q = q.contains('grain_type', [grain])
    if (source !== 'All') q = q.eq('distillery_source', source)
    if (finish !== 'All') q = q.ilike('finish_type', `%${finish}%`)

    if (sort === 'profile') q = q.order('profile_match_score', { ascending: false })
    else if (sort === 'status') q = q.order('status')
    else if (sort === 'name') q = q.order('barrel_number')
    else q = q.order('entry_date', { ascending: false })

    const { data } = await q.limit(100)
    setBarrels((data || []) as Barrel[])
    setLoading(false)
  }, [status, grain, source, finish, sort])

  useEffect(() => { load() }, [load])

  function FilterChips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
    return (
      <div className="flex gap-1.5 items-center overflow-x-auto pb-1">
        <span className="text-xs text-[var(--color-text-muted)] whitespace-nowrap">{label}:</span>
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-2.5 py-1 rounded-full text-xs whitespace-nowrap min-h-[32px] transition-all ${
              value === o ? 'bg-primary text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <FilterChips label="Status" options={STATUSES} value={status} onChange={setStatus} />
        <FilterChips label="Grain" options={GRAINS} value={grain} onChange={setGrain} />
        <FilterChips label="Source" options={SOURCES} value={source} onChange={setSource} />
        <FilterChips label="Finish" options={FINISHES} value={finish} onChange={setFinish} />
      </div>

      <div className="flex items-center justify-between">
        <span className="text-sm text-[var(--color-text-muted)]">{loading ? '…' : `${barrels.length} barrels`}</span>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="text-sm border border-[var(--color-border)] rounded-lg px-2 py-1 bg-[var(--color-surface)] text-[var(--color-text)] min-h-[36px]"
        >
          <option value="entry_date">Newest first</option>
          <option value="name">Name A–Z</option>
          <option value="status">Status</option>
          <option value="profile">Profile match</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" data-tour="barrel-list-table">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => <BarrelCardSkeleton key={i} />)
          : barrels.map((barrel) => <BarrelCard key={barrel.id} barrel={barrel} />)}
      </div>

      {!loading && barrels.length === 0 && (
        <div className="text-center py-12 text-[var(--color-text-muted)]">
          <div className="text-3xl mb-2">⬡</div>
          <p className="text-sm">No barrels match these filters</p>
        </div>
      )}
    </div>
  )
}
