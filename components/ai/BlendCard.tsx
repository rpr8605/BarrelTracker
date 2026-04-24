'use client'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TagChip } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import type { BlendRecommendation } from '@/types/api'

interface BlendCardProps {
  blend: BlendRecommendation
  rank: number
  onApprove: (blend: BlendRecommendation) => void
  approving?: boolean
}

export function BlendCard({ blend, rank, onApprove, approving }: BlendCardProps) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--color-text-muted)] font-medium">#{rank}</span>
            <h3 className="font-medium text-[var(--color-text)]">{blend.name}</h3>
          </div>
          <div className="flex gap-4 mt-1 text-xs text-[var(--color-text-muted)]">
            <span>{blend.bottle_count} bottles</span>
            <span>{blend.yield_gallons}gal yield</span>
            <span>{formatCurrency(blend.cost_per_bottle)}/bottle</span>
          </div>
        </div>
        <div className="flex flex-col items-center">
          <div className="relative w-12 h-12">
            <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-border)" strokeWidth="2" />
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#BA7517" strokeWidth="2"
                strokeDasharray={`${blend.profile_match} 100`} strokeLinecap="round" />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-primary">{blend.profile_match}%</span>
          </div>
          <span className="text-[10px] text-[var(--color-text-muted)]">match</span>
        </div>
      </div>

      <div>
        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{blend.projected_flavor_profile}</p>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-[var(--color-text-muted)] font-medium">Barrels & ratios</p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(blend.blend_ratios).map(([barrelId, pct]) => (
            <TagChip key={barrelId} tag={`${barrelId.slice(-6)} — ${pct}%`} amber />
          ))}
        </div>
      </div>

      <Button onClick={() => onApprove(blend)} loading={approving} className="w-full" size="sm">
        Approve Batch
      </Button>
    </Card>
  )
}
