'use client'
import { useEffect, useState } from 'react'
import { isRecordLate, daysUntil, monthlyReportDueDate } from '@/lib/ttb/business-days'

interface Props {
  distilleryId: string | null
}

export function OverdueBanner({ distilleryId }: Props) {
  const [lateCount, setLateCount] = useState(0)
  const [reportDaysLeft, setReportDaysLeft] = useState<number | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!distilleryId) return
    const now = new Date()
    const reportDue = monthlyReportDueDate(now.getFullYear(), now.getMonth()) // prior month's report
    setReportDaysLeft(daysUntil(reportDue))

    // Check for late entries in last 7 days
    fetch(`/api/compliance/late-check?distillery_id=${distilleryId}`)
      .then((r) => r.ok ? r.json() : { late_count: 0 })
      .then((d) => setLateCount(d.late_count ?? 0))
      .catch(() => {})
  }, [distilleryId])

  if (dismissed) return null
  if (lateCount === 0 && (reportDaysLeft === null || reportDaysLeft > 7)) return null

  const banners: { msg: string; level: 'warn' | 'danger' }[] = []

  if (lateCount > 0) {
    banners.push({ msg: `${lateCount} record${lateCount > 1 ? 's' : ''} entered after the next-business-day deadline (27 CFR 19.580). These will be flagged in an audit.`, level: 'warn' })
  }

  if (reportDaysLeft !== null && reportDaysLeft <= 7) {
    const level = reportDaysLeft <= 3 ? 'danger' : 'warn'
    const msg = reportDaysLeft <= 0
      ? 'Monthly TTB reports are overdue — file immediately.'
      : `Monthly TTB reports due in ${reportDaysLeft} day${reportDaysLeft !== 1 ? 's' : ''} — generate reports now.`
    banners.push({ msg, level })
  }

  if (banners.length === 0) return null

  return (
    <div className="space-y-1 mb-4">
      {banners.map(({ msg, level }, i) => (
        <div key={i} className={`flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg text-sm ${level === 'danger' ? 'bg-danger/15 text-danger' : 'bg-amber-500/15 text-amber-500'}`}>
          <span>{msg}</span>
          {i === banners.length - 1 && (
            <button onClick={() => setDismissed(true)} className="shrink-0 opacity-60 hover:opacity-100 text-xs">Dismiss</button>
          )}
        </div>
      ))}
    </div>
  )
}
