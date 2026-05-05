import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { formatDate, formatMonths } from '@/lib/utils'
import { getBarrelAgeMonths } from '@/lib/tags'
import type { Barrel, Distillery } from '@/types/database'
import { AdoptButtons } from './AdoptButtons'

export const dynamic = 'force-dynamic'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

function StatusBadge({ status }: { status: Barrel['status'] }) {
  const map: Record<Barrel['status'], { label: string; color: string }> = {
    aging:   { label: 'Aging',   color: 'bg-amber-700/30 text-amber-300 border border-amber-700/40' },
    ready:   { label: 'Ready',   color: 'bg-green-800/30 text-green-300 border border-green-800/40' },
    bottled: { label: 'Bottled', color: 'bg-neutral-700/40 text-neutral-400 border border-neutral-700/40' },
    dumped:  { label: 'Dumped',  color: 'bg-neutral-700/40 text-neutral-400 border border-neutral-700/40' },
  }
  const s = map[status] ?? map.aging
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${s.color}`}>{s.label}</span>
}

export default async function AdoptPage({ params }: { params: { barrelId: string } }) {
  const { data: barrel } = await admin
    .from('barrels')
    .select('*')
    .eq('id', params.barrelId)
    .single()

  if (!barrel) notFound()

  const b = barrel as Barrel

  const { data: distillery } = await admin
    .from('distilleries')
    .select('id, name, location')
    .eq('id', b.distillery_id)
    .single()

  const dist = distillery as Distillery | null
  const ageMonths = getBarrelAgeMonths(b.entry_date)
  const unavailable = b.status === 'bottled' || b.status === 'dumped'

  // Aging timeline progress
  const entryMs = b.entry_date ? new Date(b.entry_date).getTime() : Date.now()
  const peakMs = b.predicted_peak_date ? new Date(b.predicted_peak_date).getTime() : entryMs + 1000 * 60 * 60 * 24 * 365 * 4
  const nowMs = Date.now()
  const progressPct = Math.min(100, Math.max(0, Math.round(((nowMs - entryMs) / (peakMs - entryMs)) * 100)))

  const angelsShare = b.angels_share_pct ?? 0
  const distilleryName = dist?.name ?? 'This Distillery'

  return (
    <div className="min-h-screen bg-[#0f0b07] text-[#f5f0e8]">
      {/* Top nav */}
      <nav className="border-b border-white/5 px-5 py-4 flex items-center gap-3">
        <span className="text-[#BA7517] font-semibold tracking-wide text-sm">Still</span>
        {dist && (
          <>
            <span className="text-white/20">/</span>
            <Link href={`/distillery/${dist.id}`} className="text-sm text-[#f5f0e8]/60 hover:text-[#f5f0e8] transition-colors">
              {dist.name}
            </Link>
          </>
        )}
      </nav>

      <div className="max-w-2xl mx-auto px-5 py-10 space-y-10">

        {/* Hero */}
        <div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[#BA7517] text-xs font-medium tracking-widest uppercase mb-2">{distilleryName}</p>
              <h1 className="text-4xl font-semibold">Barrel {b.barrel_number}</h1>
              <p className="text-[#f5f0e8]/50 mt-1 text-sm">
                {b.grain_type?.join(', ') || b.mash_bill || 'Whiskey'} · {formatMonths(ageMonths)} old
              </p>
            </div>
            <StatusBadge status={b.status} />
          </div>
        </div>

        {/* Aging Timeline */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#f5f0e8]/40">
            <span>Entered {formatDate(b.entry_date)}</span>
            <span>Peak {formatDate(b.predicted_peak_date)}</span>
          </div>
          <div className="h-2 rounded-full bg-white/10 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#BA7517] to-amber-400"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <p className="text-xs text-[#f5f0e8]/40 text-right">{progressPct}% of projected aging complete</p>
        </div>

        {/* Flavor tags */}
        {b.tags && b.tags.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#f5f0e8]/40 uppercase tracking-widest">Flavor Profile</p>
            <div className="flex flex-wrap gap-2">
              {b.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-[#BA7517]/15 text-[#BA7517] border border-[#BA7517]/25 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Angel's share */}
        <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8">
          <div className="text-2xl">🥃</div>
          <div>
            <p className="text-sm font-medium">Angel&apos;s Share</p>
            <p className="text-xs text-[#f5f0e8]/50 mt-0.5">
              An estimated <span className="text-[#BA7517] font-semibold">{angelsShare.toFixed(1)}%</span> of this barrel has evaporated during aging — concentrating its flavor.
            </p>
          </div>
        </div>

        {/* Unavailable banner */}
        {unavailable ? (
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 text-center">
            <p className="text-lg font-medium text-[#f5f0e8]/60">This barrel is no longer available for adoption</p>
            <p className="text-sm text-[#f5f0e8]/30 mt-2">
              {b.status === 'bottled' ? 'This barrel has already been bottled.' : 'This barrel has been retired.'}
            </p>
          </div>
        ) : (
          <>
            {/* Adoption options */}
            <div>
              <p className="text-xs font-medium text-[#f5f0e8]/40 uppercase tracking-widest mb-4">Choose Your Adoption</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Barrel */}
                <div className="p-6 rounded-2xl border border-[#BA7517]/30 bg-[#BA7517]/5 flex flex-col gap-4">
                  <div>
                    <p className="text-xs text-[#BA7517] font-medium uppercase tracking-widest">Full Barrel</p>
                    <p className="text-3xl font-semibold mt-1">$2,500</p>
                  </div>
                  <ul className="space-y-2 text-sm text-[#f5f0e8]/70 flex-1">
                    <li className="flex items-center gap-2"><span className="text-[#BA7517]">✓</span> Exclusive naming rights</li>
                    <li className="flex items-center gap-2"><span className="text-[#BA7517]">✓</span> All voice note updates</li>
                    <li className="flex items-center gap-2"><span className="text-[#BA7517]">✓</span> Priority bottling notification</li>
                    <li className="flex items-center gap-2"><span className="text-[#BA7517]">✓</span> Barrel passport access</li>
                  </ul>
                  <AdoptButtons barrelId={params.barrelId} tier="full" distilleryName={distilleryName} />
                </div>

                {/* Share Adoption */}
                <div className="p-6 rounded-2xl border border-white/10 bg-white/5 flex flex-col gap-4">
                  <div>
                    <p className="text-xs text-[#f5f0e8]/50 font-medium uppercase tracking-widest">Share Adoption</p>
                    <p className="text-3xl font-semibold mt-1">$250<span className="text-base font-normal text-[#f5f0e8]/50">/share</span></p>
                  </div>
                  <ul className="space-y-2 text-sm text-[#f5f0e8]/70 flex-1">
                    <li className="flex items-center gap-2"><span className="text-[#BA7517]">✓</span> 1/10 of the barrel</li>
                    <li className="flex items-center gap-2"><span className="text-[#BA7517]">✓</span> Voice note access</li>
                    <li className="flex items-center gap-2"><span className="text-[#BA7517]">✓</span> Barrel passport access</li>
                    <li className="flex items-center gap-2"><span className="text-[#BA7517]">✓</span> Bottling notification</li>
                  </ul>
                  <AdoptButtons barrelId={params.barrelId} tier="share" distilleryName={distilleryName} />
                </div>
              </div>
            </div>
          </>
        )}

        <p className="text-xs text-[#f5f0e8]/20 text-center pb-4">Powered by Still · Craft Distillery Management</p>
      </div>
    </div>
  )
}
