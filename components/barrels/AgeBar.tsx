'use client'
import { getBarrelAgeMonths, getAgeColor } from '@/lib/tags'
import { formatMonths } from '@/lib/utils'
import { formatDate } from '@/lib/utils'

export function AgeBar({ entryDate, predictedPeakDate }: { entryDate: string | null; predictedPeakDate?: string | null }) {
  const months = getBarrelAgeMonths(entryDate)
  const peakMonths = predictedPeakDate ? getBarrelAgeMonths(predictedPeakDate) - months + months : null
  const maxMonths = 60
  const pct = Math.min((months / maxMonths) * 100, 100)
  const color = getAgeColor(months)

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>{formatMonths(months)} old</span>
        {predictedPeakDate && <span>Peak {formatDate(predictedPeakDate)}</span>}
      </div>
      <div className="h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
    </div>
  )
}
