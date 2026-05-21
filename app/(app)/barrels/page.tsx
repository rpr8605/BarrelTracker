'use client'
import { useState, useEffect, useCallback } from 'react'
import { BarrelCard, BarrelCardSkeleton } from '@/components/barrels/BarrelCard'
import { createClient } from '@/lib/supabase'
import type { Barrel } from '@/types/database'
import { useSearchParams } from 'next/navigation'
import { ListFilter, Bookmark, Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

const STATUSES = ['All', 'Aging', 'Ready', 'Bottled', 'Dumped']
const GRAINS = ['All', 'Wheat', 'Rye', 'Corn', 'High Rye', 'Four Grain']
const SOURCES = ['All', 'MGP', 'Buffalo Trace', 'Heaven Hill', 'Willett', 'New Riff']
const FINISHES = ['All', 'Port', 'Sherry', 'Rum', 'Wine', 'None']

const SAVED_VIEWS = [
  { id: 'all', label: 'All Barrels', icon: ListFilter },
  { id: 'mgp', label: 'MGP Stock', icon: Bookmark, filter: { source: 'MGP' } },
  { id: 'old', label: '10+ Year Barrels', icon: Bookmark, filter: { minAge: 10 } },
  { id: 'ready', label: 'Ready for Bottling', icon: Bookmark, filter: { status: 'Ready' } },
]

const CUSTOM_LISTS = [
  { id: 'l1', label: 'Spring 2024 Release' },
  { id: 'l2', label: 'Experimentals' },
]

export default function BarrelsPage() {
  const searchParams = useSearchParams()
  const [barrels, setBarrels] = useState<Barrel[]>([])
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState(searchParams.get('status') || 'All')
  const [grain, setGrain] = useState('All')
  const [source, setSource] = useState('All')
  const [finish, setFinish] = useState('All')
  const [sort, setSort] = useState('entry_date')
  const [activeView, setActiveView] = useState('all')

  const load = useCallback(async () => {
    setLoading(true)
    const supabase = createClient()
    let q = supabase.from('barrels').select('*')

    // Apply filters
    if (status !== 'All') q = q.eq('status', status.toLowerCase())
    if (grain !== 'All') q = q.contains('grain_type', [grain])
    if (source !== 'All') q = q.eq('distillery_source', source)
    if (finish !== 'All') q = q.ilike('finish_type', `%${finish}%`)

    // Apply Saved View logic
    const view = SAVED_VIEWS.find(v => v.id === activeView)
    if (view?.filter) {
      if (view.filter.source) q = q.eq('distillery_source', view.filter.source)
      if (view.filter.status) q = q.eq('status', view.filter.status.toLowerCase())
      // minAge would require a calculation or a column we don't necessarily have in this mock, 
      // but we'll simulate by filtering if it were there.
    }

    if (sort === 'profile') q = q.order('profile_match_score', { ascending: false })
    else if (sort === 'status') q = q.order('status')
    else if (sort === 'name') q = q.order('barrel_number')
    else q = q.order('entry_date', { ascending: false })

    const { data } = await q.limit(100)
    setBarrels((data || []) as Barrel[])
    setLoading(false)
  }, [status, grain, source, finish, sort, activeView])

  useEffect(() => { load() }, [load])

  function FilterChips({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) {
    return (
      <div className="flex gap-1.5 items-center overflow-x-auto pb-1 no-scrollbar">
        <span className="text-[10px] font-bold uppercase tracking-tight text-[var(--color-text-muted)] whitespace-nowrap min-w-[50px]">{label}:</span>
        {options.map((o) => (
          <button
            key={o}
            onClick={() => onChange(o)}
            className={`px-3 py-1 rounded-full text-xs whitespace-nowrap transition-all border ${
              value === o ? 'bg-primary border-primary text-white font-medium' : 'bg-[var(--color-bg-secondary)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-text-muted)]'
            }`}
          >
            {o}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div className="flex gap-6 h-full">
      {/* Sidebar Filters */}
      <aside className="hidden lg:flex flex-col w-64 gap-6 shrink-0">
        <div className="space-y-4">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)] px-1">Saved Views</h3>
          <nav className="space-y-1">
            {SAVED_VIEWS.map((view) => (
              <button
                key={view.id}
                onClick={() => setActiveView(view.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeView === view.id 
                    ? 'bg-primary/10 text-primary font-bold' 
                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                <view.icon className={`w-4 h-4 ${activeView === view.id ? 'text-primary' : 'text-[var(--color-text-muted)]'}`} />
                {view.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-muted)]">Custom Lists</h3>
            <button className="text-primary hover:text-primary-dark transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <nav className="space-y-1">
            {CUSTOM_LISTS.map((list) => (
              <button
                key={list.id}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] transition-colors group"
              >
                <div className="w-2 h-2 rounded-full bg-[var(--color-border)] group-hover:bg-primary transition-colors" />
                {list.label}
              </button>
            ))}
          </nav>
        </div>

        <Card className="mt-auto bg-primary/5 border-primary/10 p-4">
          <p className="text-xs font-bold text-primary mb-1 uppercase tracking-tight">Pro Tip</p>
          <p className="text-[11px] text-[var(--color-text-secondary)] leading-relaxed">
            Use "Smart Filters" to create dynamic lists that update automatically as barrels age.
          </p>
          <Button variant="ghost" size="sm" className="w-full mt-3 text-[10px] h-8">Learn More</Button>
        </Card>
      </aside>

      {/* Main Content */}
      <div className="flex-1 space-y-4 min-w-0">
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl p-3 space-y-3 shadow-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input 
              type="text" 
              placeholder="Search by barrel #, mashbill, or notes..." 
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="space-y-2">
            <FilterChips label="Status" options={STATUSES} value={status} onChange={setStatus} />
            <FilterChips label="Grain" options={GRAINS} value={grain} onChange={setGrain} />
            <FilterChips label="Source" options={SOURCES} value={source} onChange={setSource} />
            <FilterChips label="Finish" options={FINISHES} value={finish} onChange={setFinish} />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="font-bold text-lg">
              {SAVED_VIEWS.find(v => v.id === activeView)?.label || 'All Barrels'}
            </h2>
            <span className="text-xs px-2 py-0.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded text-[var(--color-text-muted)]">
              {loading ? '…' : `${barrels.length} units`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)] hidden sm:inline">Sort:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="text-xs font-medium border border-[var(--color-border)] rounded-lg px-2 py-1.5 bg-[var(--color-surface)] text-[var(--color-text)] focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="entry_date">Newest first</option>
              <option value="name">Name A–Z</option>
              <option value="status">Status</option>
              <option value="profile">Profile match</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" data-tour="barrel-list-table">
          {loading
            ? Array.from({ length: 6 }).map((_, i) => <BarrelCardSkeleton key={i} />)
            : barrels.map((barrel) => <BarrelCard key={barrel.id} barrel={barrel} />)}
        </div>

        {!loading && barrels.length === 0 && (
          <div className="text-center py-16 text-[var(--color-text-muted)] bg-[var(--color-bg-secondary)]/30 rounded-2xl border-2 border-dashed border-[var(--color-border)]">
            <div className="text-4xl mb-3 opacity-20">⬡</div>
            <p className="text-sm font-medium">No barrels match your current filters</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-4 text-primary"
              onClick={() => {
                setStatus('All')
                setGrain('All')
                setSource('All')
                setFinish('All')
                setActiveView('all')
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
