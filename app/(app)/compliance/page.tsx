'use client'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { createClient } from '@/lib/supabase'
import { formatDate } from '@/lib/utils'
import type { TtbReport } from '@/types/database'

function getMonths() {
  const months = []
  const now = new Date()
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ date: d.toISOString().split('T')[0], label: d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) })
  }
  return months
}

export default function CompliancePage() {
  const [reports, setReports] = useState<TtbReport[]>([])
  const [generating, setGenerating] = useState<string | null>(null)
  const [distilleryId, setDistilleryId] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('distilleries').select('id').eq('owner_id', user.id).limit(1).single().then(({ data }) => {
        if (data) {
          setDistilleryId(data.id)
          supabase.from('ttb_reports').select('*').eq('distillery_id', data.id).order('report_month', { ascending: false }).then(({ data: r }) => {
            setReports((r || []) as TtbReport[])
          })
        }
      })
    })
  }, [])

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

  async function markFiled(reportId: string) {
    const supabase = createClient()
    await supabase.from('ttb_reports').update({ status: 'filed' }).eq('id', reportId)
    setReports((prev) => prev.map((r) => r.id === reportId ? { ...r, status: 'filed' as const } : r))
  }

  const months = getMonths()
  const reportMap = new Map(reports.map((r) => [r.report_month, r]))

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <h1 className="font-medium text-lg">TTB Compliance</h1>
      <p className="text-sm text-[var(--color-text-muted)]">Monthly distilled spirits plant reports</p>

      <div className="space-y-2">
        {months.map(({ date, label }) => {
          const report = reportMap.get(date)
          const isPast = new Date(date) < new Date()
          const isCurrentMonth = date === new Date().toISOString().slice(0, 7) + '-01'

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
                      <Button variant="secondary" size="sm" onClick={() => markFiled(report.id)}>Mark filed</Button>
                    )}
                  </>
                ) : isPast ? (
                  <Button
                    size="sm"
                    onClick={() => generate(date)}
                    loading={generating === date}
                  >
                    Generate
                  </Button>
                ) : (
                  <Badge label="Upcoming" variant="default" />
                )}
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
