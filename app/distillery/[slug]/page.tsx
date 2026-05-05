import { createClient } from '@supabase/supabase-js'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { FollowButton } from '@/components/consumer/FollowButton'

export const dynamic = 'force-dynamic'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

interface PageData {
  id: string
  distillery_id: string
  slug: string
  headline: string | null
  story_text: string | null
  hero_image_url: string | null
  veteran_org: string | null
  veteran_revenue_pct: number | null
  distilleries: {
    id: string
    name: string
    location: string | null
    logo_url: string | null
  }
}

interface Barrel {
  id: string
  barrel_number: string
  entry_date: string | null
  grain_type: string | null
  status: string
  predicted_peak_date: string | null
}

interface DropEvent {
  id: string
  name: string
  drop_date: string | null
  status: string
  bottle_count: number | null
  price_per_bottle: number | null
}

async function fetchPage(slug: string): Promise<PageData | null> {
  const { data } = await admin
    .from('distillery_pages')
    .select(`
      id,
      distillery_id,
      slug,
      headline,
      story_text,
      hero_image_url,
      veteran_org,
      veteran_revenue_pct,
      distilleries (
        id,
        name,
        location,
        logo_url
      )
    `)
    .eq('slug', slug)
    .single()
  return data as PageData | null
}

async function fetchBarrels(distilleryId: string): Promise<Barrel[]> {
  const { data } = await admin
    .from('barrels')
    .select('id, barrel_number, entry_date, grain_type, status, predicted_peak_date')
    .eq('distillery_id', distilleryId)
    .in('status', ['aging', 'ready'])
    .order('entry_date', { ascending: false })
    .limit(12)
  return (data ?? []) as Barrel[]
}

async function fetchDropEvents(distilleryId: string): Promise<DropEvent[]> {
  const { data } = await admin
    .from('drop_events')
    .select('id, name, drop_date, status, bottle_count, price_per_bottle')
    .eq('distillery_id', distilleryId)
    .in('status', ['open', 'waitlist'])
    .order('drop_date', { ascending: true })
    .limit(6)
  return (data ?? []) as DropEvent[]
}

function ageMonths(entry: string | null): string {
  if (!entry) return '—'
  const months = Math.floor(
    (Date.now() - new Date(entry).getTime()) / (1000 * 60 * 60 * 24 * 30.44)
  )
  return months < 1 ? '< 1 mo' : `${months} mo`
}

function formatDate(d: string | null): string {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function StatusPill({ status }: { status: string }) {
  const styles: Record<string, string> = {
    aging: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    ready: 'bg-green-500/20 text-green-300 border-green-500/40',
    open: 'bg-[#BA7517]/20 text-[#BA7517] border-[#BA7517]/40',
    waitlist: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  }
  return (
    <span
      className={`inline-block text-xs font-semibold uppercase tracking-wide border rounded-full px-2.5 py-0.5 ${styles[status] ?? 'bg-white/10 text-white/60 border-white/20'}`}
    >
      {status}
    </span>
  )
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const page = await fetchPage(params.slug)
  if (!page) return { title: 'Distillery — Still' }

  const name = page.distilleries?.name ?? 'Distillery'
  const description = page.headline ?? `${name} on Still — barrel tracking & tasting notes`

  return {
    title: `${name} — Still`,
    description,
    openGraph: {
      title: `${name} — Still`,
      description,
      images: [
        {
          url: `/api/og?type=barrel&distilleryName=${encodeURIComponent(name)}`,
          width: 1200,
          height: 630,
          alt: `${name} on Still`,
        },
      ],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${name} — Still`,
      description,
      images: [`/api/og?type=barrel&distilleryName=${encodeURIComponent(name)}`],
    },
  }
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function DistilleryProfilePage({
  params,
}: {
  params: { slug: string }
}) {
  const page = await fetchPage(params.slug)
  if (!page) notFound()

  const [barrels, drops] = await Promise.all([
    fetchBarrels(page.distillery_id),
    fetchDropEvents(page.distillery_id),
  ])

  const distillery = page.distilleries
  const name = distillery?.name ?? 'Distillery'
  const hasHero = !!page.hero_image_url

  return (
    <div className="min-h-screen font-sans" style={{ background: '#0f0b07', color: '#f5f0e8' }}>
      {/* ── Hero ── */}
      <section
        className="relative w-full"
        style={{ minHeight: 420 }}
      >
        {hasHero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={page.hero_image_url!}
            alt={name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #1a1209 0%, #0f0b07 50%, #2a1a05 100%)',
            }}
          />
        )}

        {/* Scrim */}
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, rgba(15,11,7,0.3) 0%, rgba(15,11,7,0.85) 100%)' }}
        />

        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-8 pb-16 flex flex-col gap-4">
          {/* Still wordmark */}
          <div
            className="text-sm font-bold tracking-widest uppercase"
            style={{ color: '#BA7517' }}
          >
            STILL
          </div>

          {/* Logo + name */}
          <div className="flex items-center gap-4 mt-auto pt-24">
            {distillery?.logo_url && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={distillery.logo_url}
                alt={name}
                className="w-16 h-16 rounded-full object-cover border-2"
                style={{ borderColor: '#BA7517' }}
              />
            )}
            <div>
              <h1
                className="text-4xl md:text-5xl font-bold"
                style={{ fontFamily: 'Georgia, serif', color: '#f5f0e8' }}
              >
                {name}
              </h1>
              {distillery?.location && (
                <p className="text-sm mt-1" style={{ color: '#a89070' }}>
                  {distillery.location}
                </p>
              )}
            </div>
          </div>

          {page.headline && (
            <p className="text-lg md:text-xl max-w-2xl" style={{ color: '#d4c0a0' }}>
              {page.headline}
            </p>
          )}

          {/* Follow */}
          <div className="mt-4">
            <FollowButton entityType="distillery" entityId={page.distillery_id} />
          </div>
        </div>
      </section>

      {/* ── Story ── */}
      {page.story_text && (
        <section className="max-w-3xl mx-auto px-6 py-14">
          <h2
            className="text-2xl font-bold mb-6"
            style={{ fontFamily: 'Georgia, serif', color: '#f5f0e8' }}
          >
            Our Story
          </h2>
          <div
            className="text-base leading-8 whitespace-pre-wrap"
            style={{ color: '#c9b48a' }}
          >
            {page.story_text}
          </div>
        </section>
      )}

      {/* ── Active Barrels ── */}
      {barrels.length > 0 && (
        <section
          className="max-w-5xl mx-auto px-6 py-10"
          style={{ borderTop: '1px solid rgba(186,117,23,0.15)' }}
        >
          <h2
            className="text-2xl font-bold mb-6"
            style={{ fontFamily: 'Georgia, serif', color: '#f5f0e8' }}
          >
            Active Barrels
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {barrels.map((b) => (
              <div
                key={b.id}
                className="rounded-xl p-5 flex flex-col gap-2"
                style={{ background: '#1a1209', border: '1px solid rgba(186,117,23,0.15)' }}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg" style={{ color: '#f5f0e8' }}>
                    {b.barrel_number}
                  </span>
                  <StatusPill status={b.status} />
                </div>
                {b.grain_type && (
                  <div className="text-sm" style={{ color: '#a89070' }}>
                    {b.grain_type}
                  </div>
                )}
                <div className="text-xs mt-1 flex gap-4" style={{ color: '#a89070' }}>
                  <span>Entered {formatDate(b.entry_date)}</span>
                  <span>Age: {ageMonths(b.entry_date)}</span>
                </div>
                {b.predicted_peak_date && (
                  <div className="text-xs" style={{ color: '#BA7517' }}>
                    Peak est. {formatDate(b.predicted_peak_date)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Upcoming Releases ── */}
      {drops.length > 0 && (
        <section
          className="max-w-5xl mx-auto px-6 py-10"
          style={{ borderTop: '1px solid rgba(186,117,23,0.15)' }}
        >
          <h2
            className="text-2xl font-bold mb-6"
            style={{ fontFamily: 'Georgia, serif', color: '#f5f0e8' }}
          >
            Upcoming Releases
          </h2>
          <div className="flex flex-col gap-4">
            {drops.map((d) => (
              <div
                key={d.id}
                className="rounded-xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
                style={{ background: '#1a1209', border: '1px solid rgba(186,117,23,0.15)' }}
              >
                <div className="flex-1">
                  <div className="font-semibold text-lg" style={{ color: '#f5f0e8' }}>
                    {d.name}
                  </div>
                  {d.drop_date && (
                    <div className="text-sm mt-1" style={{ color: '#a89070' }}>
                      {formatDate(d.drop_date)}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {d.bottle_count && (
                    <span className="text-sm" style={{ color: '#a89070' }}>
                      {d.bottle_count} bottles
                    </span>
                  )}
                  {d.price_per_bottle && (
                    <span
                      className="font-bold text-lg"
                      style={{ color: '#BA7517' }}
                    >
                      ${d.price_per_bottle}
                    </span>
                  )}
                  <StatusPill status={d.status} />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Veteran Org ── */}
      {page.veteran_org && (
        <section
          className="max-w-5xl mx-auto px-6 py-10"
          style={{ borderTop: '1px solid rgba(186,117,23,0.15)' }}
        >
          <div
            className="rounded-2xl px-8 py-7 flex items-center gap-6"
            style={{ background: 'rgba(186,117,23,0.1)', border: '1px solid rgba(186,117,23,0.3)' }}
          >
            <div className="text-4xl">🎖️</div>
            <div>
              <div className="font-bold text-lg" style={{ color: '#BA7517' }}>
                Supporting Our Veterans
              </div>
              <div className="text-sm mt-1" style={{ color: '#c9b48a' }}>
                {page.veteran_revenue_pct
                  ? `${page.veteran_revenue_pct}% of revenue supports `
                  : 'Proud to support '}
                <span className="font-semibold" style={{ color: '#f5f0e8' }}>
                  {page.veteran_org}
                </span>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <footer
        className="w-full py-8 text-center text-xs"
        style={{
          borderTop: '1px solid rgba(255,255,255,0.06)',
          color: 'rgba(255,255,255,0.25)',
          marginTop: 40,
        }}
      >
        Powered by{' '}
        <span style={{ color: '#BA7517', fontWeight: 600 }}>Still</span>
        {' '}· Craft Distillery Management
      </footer>
    </div>
  )
}
