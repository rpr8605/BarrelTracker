'use client'
import type { CBMAStatus } from '@/lib/ttb/cbma-calculator'

interface Props { status: CBMAStatus }

export function CBMAMeter({ status }: Props) {
  const pct = Math.min(100, status.pct_used)
  const barColor = status.warning_level === 'exceeded' ? 'bg-danger' : status.warning_level === 'near' ? 'bg-amber-500' : status.warning_level === 'approaching' ? 'bg-amber-400' : 'bg-primary'

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
        <span>CBMA threshold — {status.calendar_year}</span>
        <span className={status.warning_level === 'exceeded' ? 'text-danger font-medium' : ''}>
          {status.ytd_proof_gallons.toLocaleString('en-US', { maximumFractionDigits: 2 })} / 100,000 PG
        </span>
      </div>
      <div className="h-3 rounded-full bg-[var(--color-bg-secondary)] overflow-hidden">
        <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="flex justify-between text-xs">
        <span className="text-[var(--color-text-muted)]">
          Current rate: <span className="font-mono font-medium text-[var(--color-text)]">${status.current_rate.toFixed(2)}/PG</span>
        </span>
        {status.cbma_remaining > 0 && (
          <span className="text-[var(--color-text-muted)]">
            {status.cbma_remaining.toLocaleString('en-US', { maximumFractionDigits: 0 })} PG remaining at $2.70
          </span>
        )}
      </div>
      {status.warning_level !== 'none' && (
        <div className={`text-xs px-3 py-2 rounded-lg ${status.warning_level === 'exceeded' ? 'bg-danger/10 text-danger' : 'bg-amber-500/10 text-amber-400'}`}>
          {status.warning_level === 'exceeded'
            ? `CBMA threshold exceeded — all removals now at $13.50/PG. YTD tax at standard rate: $${status.ytd_tax_at_1350.toLocaleString('en-US', { maximumFractionDigits: 2 })}.`
            : `Approaching CBMA threshold — ${status.cbma_remaining.toLocaleString('en-US', { maximumFractionDigits: 0 })} PG remaining at reduced rate.`}
        </div>
      )}
    </div>
  )
}
