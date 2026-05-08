'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase'
import { getMyDistilleryId } from '@/lib/distillery'
import { TTB_SPIRITS_TYPES, formatWineGal, formatProofGal } from '@/lib/ttb'
import { formatDate } from '@/lib/utils'
import type { ComplianceSnapshot, TtbReport } from '@/types/database'

function getMonths() {
  const months = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({
      date: d.toISOString().split('T')[0],
      label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    })
  }
  return months
}

function spirits_label(v: string) {
  return TTB_SPIRITS_TYPES.find((t) => t.value === v)?.label ?? v
}

export default function CompliancePage() {
  const [snapshots, setSnapshots] = useState<ComplianceSnapshot[]>([])
  const [reports, setReports] = useState<TtbReport[]>([])
  const [distilleryId, setDistilleryId] = useState<string | null>(null)
  const [reconciling, setReconciling] = useState<string | null>(null)
  const [generating, setGenerating] = useState<string | null>(null)
  const [tab, setTab] = useState<'snapshots' | 'reports'>('snapshots')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      getMyDistilleryId(supabase, user.id).then((id) => {
        if (!id) return
        setDistilleryId(id)
        fetch(`/api/compliance/snapshots?distillery_id=${id}`)
          .then((r) => r.json())
          .then((d) => setSnapshots(Array.isArray(d) ? d : []))
        supabase.from('ttb_reports').select('*').eq('distillery_id', id).order('report_month', { ascending: false })
          .then(({ data: r }) => setReports((r || []) as TtbReport[]))
      })
    })
  }, [])

  async function reconcile(period: string) {
    if (!distilleryId) return
    setReconciling(period)
    const res = await fetch('/api/compliance/reconcile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distillery_id: distilleryId, period }),
    })
    const data = await res.json()
    if (Array.isArray(data)) {
      setSnapshots((prev) => {
        const without = prev.filter((s) => s.period !== period)
        return [...data, ...without]
      })
    }
    setReconciling(null)
  }

  async function markSnapshotFiled(id: string) {
    const res = await fetch('/api/compliance/snapshots', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'filed' }),
    })
    const updated = await res.json()
    if (updated.id) {
      setSnapshots((prev) => prev.map((s) => s.id === id ? { ...s, status: 'filed' as const } : s))
    }
  }

  async function generate(month: string) {
    if (!distilleryId) return
    setGenerating(month)
    const res = await fetch('/api/compliance/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distillery_id: distilleryId, month }),
    })
    const data = await res.json()
    if (data.id) {
      setReports((prev) => {
        const without = prev.filter((r) => r.report_month !== month)
        return [data, ...without]
      })
    }
    setGenerating(null)
  }

  async function markReportFiled(reportId: string) {
    const supabase = createClient()
    await supabase.from('ttb_reports').update({ status: 'filed' }).eq('id', reportId)
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: 'filed' as const } : r))
  }

  const months = getMonths()
  const reportMap = new Map(reports.map((r) => [r.report_month, r]))

  // Group snapshots by period
  const snapshotsByPeriod = new Map<string, ComplianceSnapshot[]>()
  for (const s of snapshots) {
    const arr = snapshotsByPeriod.get(s.period) ?? []
    arr.push(s)
    snapshotsByPeriod.set(s.period, arr)
  }

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-medium text-lg">TTB Compliance</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Monthly distilled spirits plant reconciliation</p>
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--color-bg-secondary)]">
          <button
            onClick={() => setTab('snapshots')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${tab === 'snapshots' ? 'bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm' : 'text-[var(--color-text-muted)]'}`}
          >
            Proof Gallons
          </button>
          <button
            onClick={() => setTab('reports')}
            className={`px-3 py-1.5 text-sm rounded-md transition-all ${tab === 'reports' ? 'bg-[var(--color-bg)] text-[var(--color-text)] shadow-sm' : 'text-[var(--color-text-muted)]'}`}
          >
            Reports
          </button>
        </div>
      </div>

      {tab === 'snapshots' && (
        <div className="space-y-3">
          <p className="text-xs text-[var(--color-text-muted)]">
            Proof gallon reconciliation per spirits class. Reconcile each month to compute beginning / received / removed / ending inventory and flag discrepancies for TTB Form 5110.40.
          </p>
          {months.map(({ date, label }) => {
            const periodSnaps = snapshotsByPeriod.get(date) ?? []
            const isPast = new Date(date) < new Date()

            return (
              <Card key={date} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-medium text-sm">{label}</div>
                  <div className="flex items-center gap-2">
                    {periodSnaps.length === 0 ? (
                      isPast ? (
                        <Button size="sm" onClick={() => reconcile(date)} loading={reconciling === date}>
                          Reconcile
                        </Button>
                      ) : (
                        <Badge label="Upcoming" variant="default" />
                      )
                    ) : (
                      <Button size="sm" variant="secondary" onClick={() => reconcile(date)} loading={reconciling === date}>
                        Re-run
                      </Button>
                    )}
                  </div>
                </div>

                {periodSnaps.length > 0 && (
                  <div className="space-y-2">
                    {periodSnaps.map((snap) => (
                      <div key={snap.id} className="rounded-lg bg-[var(--color-bg-secondary)] p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-[var(--color-text-muted)] uppercase tracking-wide">{spirits_label(snap.spirits_type)}</span>
                          <div className="flex items-center gap-2">
                            <Badge label={snap.status === 'filed' ? 'Filed' : 'Draft'} variant={snap.status === 'filed' ? 'ready' : 'aging'} />
                            {snap.status !== 'filed' && (
                              <Button variant="secondary" size="sm" onClick={() => markSnapshotFiled(snap.id)}>Mark filed</Button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          <div>
                            <div className="text-[var(--color-text-muted)]">Beginning</div>
                            <div className="font-mono text-[var(--color-text)]">{formatWineGal(snap.beg_wine_gallons)}</div>
                            <div className="font-mono text-[var(--color-text-muted)]">{formatProofGal(snap.beg_proof_gallons)}</div>
                          </div>
                          <div>
                            <div className="text-[var(--color-text-muted)]">Received</div>
                            <div className="font-mono text-green-400">+{formatWineGal(snap.received_wine_gallons)}</div>
                            <div className="font-mono text-[var(--color-text-muted)]">+{formatProofGal(snap.received_proof_gallons)}</div>
                          </div>
                          <div>
                            <div className="text-[var(--color-text-muted)]">Removed</div>
                            <div className="font-mono text-red-400">−{formatWineGal(snap.removed_wine_gallons)}</div>
                            <div className="font-mono text-[var(--color-text-muted)]">−{formatProofGal(snap.removed_proof_gallons)}</div>
                          </div>
                          <div>
                            <div className="text-[var(--color-text-muted)]">Ending</div>
                            <div className="font-mono text-[var(--color-text)]">{formatWineGal(snap.end_wine_gallons)}</div>
                            <div className="font-mono text-[var(--color-text-muted)]">{formatProofGal(snap.end_proof_gallons)}</div>
                          </div>
                        </div>

                        {Math.abs(snap.discrepancy_wine_gallons) > 0.01 && (
                          <div className={`text-xs rounded px-2 py-1 ${Math.abs(snap.discrepancy_wine_gallons) > 1 ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'}`}>
                            Physical inventory variance: {snap.discrepancy_wine_gallons > 0 ? '+' : ''}{snap.discrepancy_wine_gallons.toFixed(2)} WG — investigate before filing
                          </div>
                        )}

                        <div className="text-[10px] text-[var(--color-text-muted)]">
                          {snap.barrel_count} barrels · Generated {formatDate(snap.generated_at)}
                          {snap.filed_at && ` · Filed ${formatDate(snap.filed_at)}`}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {tab === 'reports' && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--color-text-muted)]">AI-generated narrative compliance summaries for record-keeping.</p>
          {months.map(({ date, label }) => {
            const report = reportMap.get(date)
            const isPast = new Date(date) < new Date()

            return (
              <Card key={date} className="flex items-center justify-between gap-3">
                <div>
                  <div className="font-medium text-sm">{label}</div>
                  {report && <div className="text-xs text-[var(--color-text-muted)] mt-0.5">Generated {formatDate(report.generated_at)}</div>}
                </div>
                <div className="flex items-center gap-2">
                  {report ? (
                    <>
                      <Badge
                        label={report.status === 'filed' ? 'Filed' : 'Draft'}
                        variant={report.status === 'filed' ? 'ready' : 'aging'}
                      />
                      {report.status !== 'filed' && (
                        <Button variant="secondary" size="sm" onClick={() => markReportFiled(report.id)}>Mark filed</Button>
                      )}
                    </>
                  ) : isPast ? (
                    <Button size="sm" onClick={() => generate(date)} loading={generating === date}>Generate</Button>
                  ) : (
                    <Badge label="Upcoming" variant="default" />
                  )}
                </div>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
