import { createServiceClient } from '@/lib/supabase-server'
import { notFound } from 'next/navigation'
import { SponsorshipCheckout } from '@/components/barrel-story/SponsorshipCheckout'

const TIER_PRICES: Record<string, { cents: number; label: string; desc: string }> = {
  FOLLOWER:  { cents: 5000,   label: 'Follower',        desc: 'Your name on updates list. Milestone notifications.' },
  SUPPORTER: { cents: 25000,  label: 'Supporter',       desc: 'Name on barrel\'s public page. Certificate.' },
  SPONSOR:   { cents: 100000, label: 'Barrel Sponsor',  desc: 'Logo on page, framed certificate, early access.' },
  PARTNER:   { cents: 500000, label: 'Founding Partner',desc: 'Permanent logo, exclusive allocation, distillery visit.' },
}

export default async function SponsorPage({ params, searchParams }: {
  params: { token: string }
  searchParams: { tier?: string }
}) {
  const db = createServiceClient()
  const { data: barrel } = await db
    .from('barrels')
    .select('id, barrel_number, distillery_id, distilleries(name, brand_color, logo_url)')
    .eq('public_token', params.token)
    .single()

  if (!barrel) notFound()

  const tier = searchParams.tier && TIER_PRICES[searchParams.tier] ? searchParams.tier : 'SUPPORTER'
  const tierInfo = TIER_PRICES[tier]
  const distillery = barrel.distilleries as unknown as { name: string; brand_color: string | null; logo_url: string | null } | null
  const brandColor = distillery?.brand_color ?? '#BA7517'

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-lg mx-auto px-4 py-12 space-y-8">
        <div>
          <div className="text-xs font-medium uppercase tracking-widest mb-1" style={{ color: brandColor }}>
            {distillery?.name}
          </div>
          <h1 className="text-2xl font-bold">Sponsor Barrel #{barrel.barrel_number}</h1>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {Object.entries(TIER_PRICES).map(([key, info]) => (
            <a
              key={key}
              href={`/barrel/${params.token}/sponsor?tier=${key}`}
              className={`rounded-xl p-3 border transition-all ${tier === key ? 'border-white/50 bg-white/10' : 'border-white/10 hover:border-white/20'}`}
            >
              <div className="text-xs font-semibold mb-0.5" style={{ color: brandColor }}>{info.label}</div>
              <div className="text-sm font-medium">${(info.cents / 100).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-0.5">{info.desc}</div>
            </a>
          ))}
        </div>

        <SponsorshipCheckout
          barrelId={barrel.id}
          distilleryId={barrel.distillery_id}
          token={params.token}
          tier={tier}
          amountCents={tierInfo.cents}
          tierLabel={tierInfo.label}
          brandColor={brandColor}
        />
      </div>
    </div>
  )
}
