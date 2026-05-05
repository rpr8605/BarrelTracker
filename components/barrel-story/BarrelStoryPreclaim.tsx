'use client'
import { useState } from 'react'
import type { Barrel } from '@/types/database'
import { BarrelStoryHero } from './BarrelStoryHero'
import { AngelsShareStory } from './AngelsShareStory'
import { AgeMilestoneTimeline } from './AgeMilestoneTimeline'
import { VoiceNotePlayer } from './VoiceNotePlayer'
import { SponsorshipBadges } from './SponsorshipBadges'
import { FollowCTA } from './FollowCTA'
import { ShareButton } from './ShareButton'

interface Props {
  barrel: Barrel & { distilleries: { id: string; name: string; brand_color: string | null; logo_url: string | null } | null }
  distillery: { id: string; name: string; brand_color: string | null; logo_url: string | null; slug: string | null } | null
  brandColor: string
  voiceNote: { id: string; audio_url: string | null; transcript: string | null; duration_seconds: number | null } | null
  sponsorships: { id: string; tier: string; sponsor_name: string; sponsor_logo_url: string | null }[]
  token: string
  consumerId: string | null
  justSponsored: boolean
}

export function BarrelStoryPreclaim({
  barrel, distillery, brandColor, voiceNote, sponsorships, token, consumerId, justSponsored
}: Props) {
  const [following, setFollowing] = useState(false)
  const [followed, setFollowed] = useState(false)

  async function follow() {
    if (!consumerId) {
      window.location.href = `/signup?redirect=/barrel/${token}`
      return
    }
    setFollowing(true)
    const res = await fetch('/api/follows', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entityType: 'barrel', entityId: barrel.id }),
    })
    if (res.ok) {
      setFollowed(true)
      window.location.reload()
    }
    setFollowing(false)
  }

  return (
    <div className="min-h-screen bg-black text-white" style={{ '--brand': brandColor } as React.CSSProperties}>
      {justSponsored && (
        <div className="bg-[var(--brand)] text-white text-center py-3 text-sm font-medium">
          Your sponsorship is confirmed — thank you for supporting this barrel.
        </div>
      )}

      <BarrelStoryHero barrel={barrel} distillery={distillery} brandColor={brandColor} />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        <AngelsShareStory barrel={barrel} brandColor={brandColor} />
        <AgeMilestoneTimeline barrel={barrel} brandColor={brandColor} />

        {voiceNote?.audio_url && (
          <div>
            <h2 className="text-lg font-medium mb-3">Distiller's Voice</h2>
            <VoiceNotePlayer audioUrl={voiceNote.audio_url} transcript={voiceNote.transcript} duration={voiceNote.duration_seconds} />
          </div>
        )}

        {sponsorships.length > 0 && (
          <div>
            <h2 className="text-sm text-gray-400 mb-2">Sponsors</h2>
            <SponsorshipBadges sponsorships={sponsorships} />
          </div>
        )}

        <div className="pt-4 border-t border-white/10 space-y-3">
          <button
            onClick={follow}
            disabled={following || followed}
            className="w-full py-3 rounded-xl font-semibold text-base transition-all min-h-[52px]"
            style={{ backgroundColor: brandColor, color: '#fff' }}
          >
            {followed ? '✓ Following this barrel' : following ? 'Following...' : 'Follow this barrel'}
          </button>
          <p className="text-xs text-gray-500 text-center">Get notified at every milestone — bottling, pulls, and releases</p>
          <ShareButton token={token} barrelNumber={barrel.barrel_number} distilleryName={distillery?.name ?? 'Still'} />
        </div>

        <FollowCTA barrel={barrel} distillery={distillery} brandColor={brandColor} token={token} />
      </div>
    </div>
  )
}
