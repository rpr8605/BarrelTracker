interface Sponsorship {
  id: string
  tier: string
  sponsor_name: string
  sponsor_logo_url: string | null
}

const TIER_LABEL: Record<string, string> = {
  PARTNER: 'Founding Partner',
  SPONSOR: 'Barrel Sponsor',
  SUPPORTER: 'Supporter',
  FOLLOWER: 'Follower',
}

export function SponsorshipBadges({ sponsorships }: { sponsorships: Sponsorship[] }) {
  const partners = sponsorships.filter((s) => s.tier === 'PARTNER' || s.tier === 'SPONSOR')
  const others = sponsorships.filter((s) => s.tier === 'SUPPORTER' || s.tier === 'FOLLOWER')

  return (
    <div className="space-y-3">
      {partners.map((sp) => (
        <div key={sp.id} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          {sp.sponsor_logo_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={sp.sponsor_logo_url} alt={sp.sponsor_name} className="h-8 w-8 rounded-lg object-cover" />
          ) : (
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center text-xs font-bold">
              {sp.sponsor_name[0]}
            </div>
          )}
          <div>
            <div className="text-sm font-medium">{sp.sponsor_name}</div>
            <div className="text-xs text-gray-400">{TIER_LABEL[sp.tier]}</div>
          </div>
        </div>
      ))}
      {others.length > 0 && (
        <div className="text-xs text-gray-500">
          Also supported by {others.map((s) => s.sponsor_name).join(', ')}
        </div>
      )}
    </div>
  )
}
