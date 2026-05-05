import type { Barrel } from '@/types/database'
import Link from 'next/link'

interface Props {
  barrel: Barrel
  distillery: { name: string } | null
  brandColor: string
  token: string
}

const TIERS = [
  { key: 'FOLLOWER', label: 'Follower', price: '$25–50', desc: 'Updates at every milestone' },
  { key: 'SUPPORTER', label: 'Supporter', price: '$150–300', desc: 'Your name on this barrel\'s page' },
  { key: 'SPONSOR', label: 'Barrel Sponsor', price: '$500–1,500', desc: 'Logo placement + framed certificate' },
  { key: 'PARTNER', label: 'Founding Partner', price: '$2,500+', desc: 'Permanent logo, early access, exclusive allocation' },
]

export function FollowCTA({ barrel, distillery, brandColor, token }: Props) {
  return (
    <div className="rounded-2xl border border-white/10 p-6 space-y-4">
      <div>
        <h2 className="text-lg font-medium">Sponsor This Barrel</h2>
        <p className="text-sm text-gray-400 mt-1">
          Your name or brand becomes part of Barrel #{barrel.barrel_number}'s story forever.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {TIERS.map((tier) => (
          <Link
            key={tier.key}
            href={`/barrel/${token}/sponsor?tier=${tier.key}`}
            className="rounded-xl p-3 border border-white/10 hover:border-white/30 transition-all"
          >
            <div className="text-xs font-semibold mb-0.5" style={{ color: brandColor }}>{tier.label}</div>
            <div className="text-sm font-medium">{tier.price}</div>
            <div className="text-xs text-gray-500 mt-0.5">{tier.desc}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}
