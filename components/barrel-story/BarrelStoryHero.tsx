import type { Barrel } from '@/types/database'
import { getBarrelAgeMonths } from '@/lib/tags'

interface Props {
  barrel: Barrel
  distillery: { name: string; brand_color: string | null; logo_url: string | null } | null
  brandColor: string
}

export function BarrelStoryHero({ barrel, distillery, brandColor }: Props) {
  const ageMonths = barrel.entry_date ? getBarrelAgeMonths(barrel.entry_date) : null
  const ageYears = ageMonths ? (ageMonths / 12).toFixed(1) : null
  const grainDisplay = barrel.grain_type?.join(' · ') ?? barrel.mash_bill ?? 'Whiskey'

  return (
    <div className="relative min-h-[50vh] flex flex-col justify-end p-6 overflow-hidden">
      <div
        className="absolute inset-0 opacity-20"
        style={{ background: `radial-gradient(ellipse at top, ${brandColor}, transparent 70%)` }}
      />
      <div className="relative z-10">
        {distillery?.logo_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={distillery.logo_url} alt={distillery.name} className="h-8 mb-4 opacity-80" />
        )}
        <div className="text-xs font-medium uppercase tracking-widest mb-2" style={{ color: brandColor }}>
          {distillery?.name}
        </div>
        <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-2">
          Barrel #{barrel.barrel_number}
        </h1>
        <div className="flex flex-wrap gap-3 mt-3">
          <span className="px-3 py-1 rounded-full bg-white/10 text-sm">{grainDisplay}</span>
          {ageYears && (
            <span className="px-3 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: brandColor + '33', color: brandColor }}>
              {ageYears} years aging
            </span>
          )}
          {barrel.warehouse_row && (
            <span className="px-3 py-1 rounded-full bg-white/10 text-sm">
              {barrel.location_label ?? `Rickhouse ${barrel.warehouse_row}`}
            </span>
          )}
          <span className="px-3 py-1 rounded-full bg-white/10 text-sm capitalize">{barrel.status}</span>
        </div>
      </div>
    </div>
  )
}
