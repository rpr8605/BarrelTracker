import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { FollowConsumerButton } from '@/components/consumer/FollowConsumerButton'

interface Props {
  params: { username: string }
}

function ratingStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (i < rating ? '★' : '☆')).join('')
}

function categoryEmoji(category: string | null) {
  const map: Record<string, string> = {
    tasting: '🥃',
    collection: '🎖️',
    social: '👥',
    exploration: '🗺️',
    milestone: '🏆',
  }
  return category ? (map[category] ?? '🏅') : '🏅'
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const db = createServiceClient()
  const slug = params.username.toLowerCase()
  const { data: profile } = await db
    .from('consumer_profiles')
    .select('display_name, bio')
    .filter('lower(replace(display_name,\' \',\'-\'))', 'eq', slug)
    .maybeSingle()

  if (!profile) return { title: 'Profile not found' }
  return {
    title: `${profile.display_name} on Still`,
    description: profile.bio || 'Whiskey enthusiast',
  }
}

export default async function ConsumerProfilePage({ params }: Props) {
  const slug = params.username.toLowerCase()
  const db = createServiceClient()

  // Fetch profile by slug
  const { data: profiles } = await db
    .from('consumer_profiles')
    .select('id, user_id, display_name, avatar_url, bio, created_at')
    .limit(100)

  const profile = (profiles ?? []).find(
    (p) => p.display_name?.toLowerCase().replace(/\s+/g, '-') === slug,
  )
  if (!profile) notFound()

  // Fetch tasting notes count + recent 6
  const { count: notesCount } = await db
    .from('tasting_notes')
    .select('id', { count: 'exact', head: true })
    .eq('consumer_profile_id', profile.id)

  const { data: recentNotes } = await db
    .from('tasting_notes')
    .select('id, rating, notes, flavor_tags, created_at')
    .eq('consumer_profile_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(6)

  // Fetch badges
  const { data: earnedBadges } = await db
    .from('consumer_badges')
    .select('earned_at, badges(id, slug, name, description, image_url, category)')
    .eq('consumer_id', profile.id)

  // Follows count (distilleries + barrels + consumers this user follows)
  const { count: followingCount } = await db
    .from('follows')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', profile.user_id)

  // Get viewer
  const anonClient = createServerSupabaseClient()
  const { data: { user: viewer } } = await anonClient.auth.getUser()

  // Check if viewer follows this consumer
  let viewerFollows = false
  if (viewer && viewer.id !== profile.user_id) {
    const { data: followRow } = await db
      .from('follows')
      .select('id')
      .eq('user_id', viewer.id)
      .eq('entity_type', 'consumer')
      .eq('entity_id', profile.id)
      .maybeSingle()
    viewerFollows = !!followRow
  }

  const initials = profile.display_name
    ? profile.display_name.slice(0, 2).toUpperCase()
    : '??'
  const isOwnProfile = viewer?.id === profile.user_id

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4 max-w-2xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4 pt-4">
        {profile.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.display_name}
            className="w-16 h-16 rounded-full object-cover"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-[#BA7517] flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-semibold text-[var(--color-text)] truncate">
            {profile.display_name}
          </h1>
          {profile.bio && (
            <p className="text-sm text-[var(--color-text-muted)] mt-1 line-clamp-2">
              {profile.bio}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Tasting Notes', value: notesCount ?? 0 },
          { label: 'Badges', value: (earnedBadges ?? []).length },
          { label: 'Following', value: followingCount ?? 0 },
        ].map(({ label, value }) => (
          <div key={label} className="card p-3 text-center">
            <div className="text-2xl font-bold text-[#BA7517]">{value}</div>
            <div className="text-xs text-[var(--color-text-muted)] mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {/* Follow button */}
      {viewer && !isOwnProfile && (
        <div>
          <FollowConsumerButton
            targetConsumerId={profile.id}
            initialFollowing={viewerFollows}
          />
        </div>
      )}

      {/* Badges */}
      {(earnedBadges ?? []).length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
            Badges
          </h2>
          <div className="grid grid-cols-4 gap-3">
            {earnedBadges!.map((eb) => {
              const badge = Array.isArray(eb.badges) ? eb.badges[0] : eb.badges
              if (!badge) return null
              return (
                <div key={badge.id} className="card p-3 text-center flex flex-col items-center gap-1">
                  {badge.image_url ? (
                    <img src={badge.image_url} alt={badge.name} className="w-10 h-10 object-contain" />
                  ) : (
                    <span className="text-2xl">{categoryEmoji(badge.category)}</span>
                  )}
                  <span className="text-[10px] text-[var(--color-text-muted)] leading-tight text-center">
                    {badge.name}
                  </span>
                </div>
              )
            })}
          </div>
        </section>
      )}

      {/* Recent tasting notes */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
          Recent Notes
        </h2>
        {(recentNotes ?? []).length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No tasting notes yet.</p>
        ) : (
          <div className="space-y-3">
            {recentNotes!.map((note) => (
              <div key={note.id} className="card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[#BA7517] tracking-wide text-sm">
                    {ratingStars(note.rating)}
                  </span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {new Date(note.created_at).toLocaleDateString()}
                  </span>
                </div>
                {note.flavor_tags && note.flavor_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {(note.flavor_tags as string[]).slice(0, 6).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded-full bg-[#BA7517]/10 text-[#BA7517] text-[11px] font-medium"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {note.notes && (
                  <p className="text-sm text-[var(--color-text-muted)] line-clamp-2">{note.notes}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
