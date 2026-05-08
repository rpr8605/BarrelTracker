'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase'
import { getMyDistilleryId } from '@/lib/distillery'
import type { ComplianceDeadline } from '@/lib/ttb/compliance-calendar'

const CATEGORY_LABELS: Record<string, string> = {
  monthly_report: 'Monthly Report',
  semi_monthly_fet: 'Excise Tax',
  quarterly_inventory: 'Quarterly Inventory',
  semi_annual_inventory: 'Semi-Annual Inventory',
  permit_renewal: 'Permit Renewal',
}

const STATUS_STYLES: Record<string, string> = {
  upcoming: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]',
  due_soon: 'bg-amber-500/10 text-amber-400',
  overdue: 'bg-red-500/10 text-red-400',
  filed: 'bg-green-500/10 text-green-400',
}

const CATEGORY_DOT: Record<string, string> = {
  monthly_report: 'bg-blue-400',
  semi_monthly_fet: 'bg-purple-400',
  quarterly_inventory: 'bg-amber-400',
  semi_annual_inventory: 'bg-orange-400',
  permit_renewal: 'bg-red-400',
}

export default function CalendarPage() {
  const [distilleryId, setDistilleryId] = useState<string | null>(null)
  const [deadlines, setDeadlines] = useState<ComplianceDeadline[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [exporting, setExporting] = useState(false)

  const load = useCallback(async (id: string) => {
    const data = await fetch(`/api/compliance/calendar?distillery_id=${id}`).then((r) => r.json())
    setDeadlines(Array.isArray(data) ? data : [])
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      getMyDistilleryId(supabase, user.id).then((id) => {
        if (!id) return
        setDistilleryId(id)
        load(id)
      })
    })
  }, [load])

  async function exportICS() {
    if (!distilleryId) return
    setExporting(true)
    const res = await fetch(`/api/compliance/calendar/export.ics?distillery_id=${distilleryId}`)
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ttb-compliance.ics'
    a.click()
    URL.revokeObjectURL(url)
    setExporting(false)
  }

  const filtered = deadlines.filter((d) => {
    if (filterStatus !== 'all' && d.status !== filterStatus) return false
    if (filterCategory !== 'all' && d.category !== filterCategory) return false
    return true
  })

  const overdueCount = deadlines.filter((d) => d.status === 'overdue').length
  const dueSoonCount = deadlines.filter((d) => d.status === 'due_soon').length

  if (loading) return <div className="text-sm text-[var(--color-text-muted)] p-4">Loading calendar…</div>

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-medium text-lg">Compliance Calendar</h1>
          <p className="text-sm text-[var(--color-text-muted)]">All TTB filing deadlines in one view</p>
        </div>
        <Button size="sm" variant="secondary" onClick={exportICS} loading={exporting}>Export .ics</Button>
      </div>

      {(overdueCount > 0 || dueSoonCount > 0) && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3 text-sm text-red-400 space-y-1">
          {overdueCount > 0 && <p>{overdueCount} overdue deadline{overdueCount > 1 ? 's' : ''} — file immediately</p>}
          {dueSoonCount > 0 && <p>{dueSoonCount} deadline{dueSoonCount > 1 ? 's' : ''} due within 7 days</p>}
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        <div>
          <label className="text-xs text-[var(--color-text-muted)] block mb-1">Status</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5">
            <option value="all">All</option>
            <option value="overdue">Overdue</option>
            <option value="due_soon">Due soon</option>
            <option value="upcoming">Upcoming</option>
            <option value="filed">Filed</option>
          </select>
        </div>
        <div>
          <label className="text-xs text-[var(--color-text-muted)] block mb-1">Category</label>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5">
            <option value="all">All</option>
            {Object.entries(CATEGORY_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-sm text-[var(--color-text-muted)]">No deadlines match the current filters.</p>}
        {filtered.map((d) => (
          <Card key={d.id} className={`flex items-start justify-between gap-3 ${d.status === 'overdue' ? 'border-red-500/40' : d.status === 'due_soon' ? 'border-amber-500/40' : ''}`}>
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${CATEGORY_DOT[d.category] ?? 'bg-gray-400'}`} />
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">{d.title}</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{d.description}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {new Date(d.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </span>
                  {d.form && <span className="text-xs font-mono text-[var(--color-text-muted)]">Form {d.form}</span>}
                </div>
              </div>
            </div>
            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_STYLES[d.status]}`}>
                {d.status === 'filed' ? 'Filed' : d.status === 'overdue' ? `${Math.abs(d.days_until)}d overdue` : d.status === 'due_soon' ? `${d.days_until}d` : `${d.days_until}d`}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">{CATEGORY_LABELS[d.category]}</span>
            </div>
          </Card>
        ))}
      </div>

      <div className="pt-2 border-t border-[var(--color-border)]">
        <div className="flex gap-4 flex-wrap text-xs text-[var(--color-text-muted)]">
          {Object.entries(CATEGORY_DOT).map(([k, cls]) => (
            <span key={k} className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${cls}`} />
              {CATEGORY_LABELS[k]}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
