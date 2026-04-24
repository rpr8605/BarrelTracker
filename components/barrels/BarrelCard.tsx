'use client'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { StatusBadge, TagChip } from '@/components/ui/Badge'
import { AgeBar } from './AgeBar'
import type { Barrel } from '@/types/database'

export function BarrelCard({ barrel }: { barrel: Barrel }) {
  const topTags = (barrel.tags || []).slice(0, 3)
  const score = barrel.profile_match_score || 0

  return (
    <Link href={`/barrels/${barrel.id}`} className="block">
      <Card className="hover:border-primary/40 transition-all active:scale-[0.99]">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--color-text)]">{barrel.barrel_number}</span>
              <StatusBadge status={barrel.status} />
              {barrel.nfc_tag_id && (
                <span className="text-xs text-primary" title="NFC linked">◈</span>
              )}
            </div>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {barrel.mash_bill || barrel.distillery_source || 'No details'}
              {barrel.warehouse_row && ` · Row ${barrel.warehouse_row}-${barrel.warehouse_slot}`}
            </p>
          </div>
          {score > 0 && (
            <div className="flex flex-col items-center">
              <div className="relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--color-border)" strokeWidth="2.5" />
                  <circle
                    cx="18" cy="18" r="15.9" fill="none"
                    stroke="#BA7517" strokeWidth="2.5"
                    strokeDasharray={`${score} 100`}
                    strokeLinecap="round"
                  />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[9px] font-medium text-primary">
                  {score}
                </span>
              </div>
            </div>
          )}
        </div>

        <AgeBar entryDate={barrel.entry_date} predictedPeakDate={barrel.predicted_peak_date} />

        {topTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {topTags.map((tag) => (
              <TagChip key={tag} tag={tag} />
            ))}
          </div>
        )}
      </Card>
    </Link>
  )
}

export function BarrelCardSkeleton() {
  return (
    <Card>
      <div className="flex justify-between mb-3">
        <div className="space-y-2">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-3 w-36" />
        </div>
        <div className="skeleton h-10 w-10 rounded-full" />
      </div>
      <div className="skeleton h-2 w-full mb-2" />
      <div className="flex gap-1">
        <div className="skeleton h-5 w-16 rounded-full" />
        <div className="skeleton h-5 w-20 rounded-full" />
      </div>
    </Card>
  )
}
