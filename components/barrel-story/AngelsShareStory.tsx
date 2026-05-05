import type { Barrel } from '@/types/database'
import { getBarrelAgeMonths, estimateAngelsShare } from '@/lib/tags'

interface Props { barrel: Barrel; brandColor: string }

export function AngelsShareStory({ barrel, brandColor }: Props) {
  const ageMonths = barrel.entry_date ? getBarrelAgeMonths(barrel.entry_date) : 0
  const ageYears = ageMonths / 12
  const share = estimateAngelsShare(ageMonths, barrel.warehouse_tier ?? null)
  const fillGallons = barrel.entry_proof ? 53 * (barrel.entry_proof / 100) : 53
  const lostGallons = (fillGallons * share / 100).toFixed(1)

  if (ageYears < 0.5) return null

  return (
    <div className="rounded-2xl border border-white/10 p-6 space-y-3">
      <h2 className="text-lg font-medium">The Angel's Share</h2>
      <p className="text-gray-300 leading-relaxed">
        Over {ageYears.toFixed(1)} years aging in oak, <span style={{ color: brandColor }} className="font-semibold">{share.toFixed(1)}%</span> of this barrel
        has returned to the angels — roughly <span style={{ color: brandColor }} className="font-semibold">{lostGallons} gallons</span> of whiskey
        that will never be in a bottle.
      </p>
      <p className="text-sm text-gray-500">
        What remains is more concentrated, more complex, and more rare than the day it was filled.
      </p>
      <div className="flex items-center gap-3 mt-2">
        <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${100 - share}%`, backgroundColor: brandColor }}
          />
        </div>
        <span className="text-xs text-gray-400">{(100 - share).toFixed(1)}% remains</span>
      </div>
    </div>
  )
}
