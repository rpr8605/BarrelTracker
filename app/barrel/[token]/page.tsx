import { createServiceClient } from '@/lib/supabase-server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import { BarrelStoryPreclaim } from '@/components/barrel-story/BarrelStoryPreclaim'
import { BarrelStoryClaimed } from '@/components/barrel-story/BarrelStoryClaimed'
import type { Barrel } from '@/types/database'
import { headers } from 'next/headers'
import { createHash } from 'crypto'
import type { Metadata } from 'next'

interface PageProps {
  params: { token: string }
  searchParams: { sponsored?: string }
}

async function getConsumerId(userId: string, db: ReturnType<typeof createServiceClient>): Promise<string | null> {
  const { data } = await db.from('consumer_profiles').select('id').eq('user_id', userId).single()
  return data?.id ?? null
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const db = createServiceClient()
  const { data: barrel } = await db
    .from('barrels')
    .select('barrel_number, mash_bill, entry_date, distilleries(name, brand_color)')
    .eq('public_token', params.token)
    .single()

  if (!barrel) return { title: 'Barrel Not Found' }

  const distillery = barrel.distilleries as unknown as { name: string; brand_color: string } | null
  const ageYears = barrel.entry_date
    ? Math.floor((Date.now() - new Date(barrel.entry_date).getTime()) / (1000 * 60 * 60 * 24 * 365))
    : null

  return {
    title: `Barrel #${barrel.barrel_number} — ${distillery?.name ?? 'Still'}`,
    description: `${ageYears ? `${ageYears}-year ` : ''}${barrel.mash_bill ?? 'whiskey'} from ${distillery?.name}. Follow this barrel's journey from grain to glass.`,
    openGraph: {
      images: [`/api/og/barrel/${params.token}`],
    },
  }
}

export default async function BarrelStoryPage({ params, searchParams }: PageProps) {
  const db = createServiceClient()

  const { data: barrel } = await db
    .from('barrels')
    .select(`
      *,
      distilleries(id, name, brand_color, logo_url, slug),
      voice_notes(id, audio_url, transcript, duration_seconds, recorded_at)
    `)
    .eq('public_token', params.token)
    .single()

  if (!barrel) notFound()

  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll() {},
      },
    }
  )
  const { data: { user } } = await supabase.auth.getUser()
  const consumerId = user ? await getConsumerId(user.id, db) : null

  const distillery = barrel.distilleries as unknown as {
    id: string; name: string; brand_color: string | null; logo_url: string | null; slug: string | null
  } | null

  // Determine QR state
  let state: 'PRE_CLAIM' | 'CLAIMED' | 'TRAIL_COMPLETE' = 'PRE_CLAIM'
  let consumerFollow = null

  if (consumerId) {
    const { data: follow } = await db
      .from('follows')
      .select('id, created_at')
      .eq('consumer_id', consumerId)
      .eq('entity_type', 'barrel')
      .eq('entity_id', barrel.id)
      .single()

    if (follow) {
      state = 'CLAIMED'
      consumerFollow = follow

      // Check trail completion for this barrel
      const { data: trailStops } = await db
        .from('trail_stops')
        .select('trail_id')
        .eq('distillery_id', distillery?.id ?? '')
        .limit(1)

      if (trailStops?.[0]) {
        const { data: passport } = await db
          .from('trail_passports')
          .select('id, completed_at')
          .eq('consumer_id', consumerId)
          .eq('trail_id', trailStops[0].trail_id)
          .not('completed_at', 'is', null)
          .single()

        if (passport?.completed_at) state = 'TRAIL_COMPLETE'
      }
    }
  }

  // Log QR event
  const headersList = headers()
  const ua = headersList.get('user-agent') ?? ''
  const ipRaw = headersList.get('x-forwarded-for') ?? '0.0.0.0'
  const ipHash = createHash('sha256').update(ipRaw.split(',')[0].trim()).digest('hex').slice(0, 16)
  const sessionId = createHash('sha256').update(ipRaw + ua + barrel.id).digest('hex').slice(0, 16)

  if (distillery?.id) {
    await db.from('barrel_qr_events').insert({
      distillery_id: distillery.id,
      barrel_id: barrel.id,
      session_id: sessionId,
      state,
      ip_hash: ipHash,
      user_agent: ua.slice(0, 200),
      consumer_id: consumerId,
    }).select()
  }

  // Get sponsorships for this barrel
  const { data: sponsorships } = await db
    .from('sponsorships')
    .select('id, tier, sponsor_name, sponsor_logo_url')
    .eq('barrel_id', barrel.id)
    .eq('status', 'ACTIVE')
    .order('created_at', { ascending: false })

  // Get tasting notes
  const { data: tastingNotesRaw } = await db
    .from('tasting_notes')
    .select('id, rating, notes, flavor_tags, created_at, consumer_profiles(display_name)')
    .eq('barrel_id', barrel.id)
    .order('created_at', { ascending: false })
    .limit(20)

  const tastingNotes = (tastingNotesRaw ?? []).map((n) => ({
    ...n,
    consumer_profiles: Array.isArray(n.consumer_profiles)
      ? (n.consumer_profiles[0] as { display_name: string } | null) ?? null
      : (n.consumer_profiles as { display_name: string } | null),
  }))

  const voiceNotes = barrel.voice_notes as unknown as Array<{
    id: string; audio_url: string | null; transcript: string | null; duration_seconds: number | null; recorded_at: string
  }> | null

  const typedBarrel = barrel as unknown as Barrel & { distilleries: typeof distillery; voice_notes: typeof voiceNotes }

  const brandColor = distillery?.brand_color ?? '#BA7517'

  if (state === 'PRE_CLAIM') {
    return (
      <BarrelStoryPreclaim
        barrel={typedBarrel}
        distillery={distillery}
        brandColor={brandColor}
        voiceNote={voiceNotes?.[0] ?? null}
        sponsorships={sponsorships ?? []}
        token={params.token}
        consumerId={consumerId}
        justSponsored={searchParams.sponsored === 'true'}
      />
    )
  }

  return (
    <BarrelStoryClaimed
      barrel={typedBarrel}
      distillery={distillery}
      brandColor={brandColor}
      voiceNote={voiceNotes?.[0] ?? null}
      sponsorships={sponsorships ?? []}
      token={params.token}
      consumerId={consumerId!}
      consumerFollow={consumerFollow}
      state={state}
      tastingNotes={tastingNotes ?? []}
      justSponsored={searchParams.sponsored === 'true'}
    />
  )
}
