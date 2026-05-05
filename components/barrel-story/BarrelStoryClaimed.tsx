'use client'
import { useState } from 'react'
import type { Barrel } from '@/types/database'
import { BarrelStoryHero } from './BarrelStoryHero'
import { AngelsShareStory } from './AngelsShareStory'
import { AgeMilestoneTimeline } from './AgeMilestoneTimeline'
import { VoiceNotePlayer } from './VoiceNotePlayer'
import { SponsorshipBadges } from './SponsorshipBadges'
import { ShareButton } from './ShareButton'
import { TastingNoteForm } from './TastingNoteForm'

interface TastingNote {
  id: string
  rating: number | null
  notes: string | null
  flavor_tags: string[] | null
  created_at: string
  consumer_profiles: { display_name: string } | null
}

interface Props {
  barrel: Barrel & { distilleries: { id: string; name: string; brand_color: string | null; logo_url: string | null } | null }
  distillery: { id: string; name: string; brand_color: string | null; logo_url: string | null; slug: string | null } | null
  brandColor: string
  voiceNote: { id: string; audio_url: string | null; transcript: string | null; duration_seconds: number | null } | null
  sponsorships: { id: string; tier: string; sponsor_name: string; sponsor_logo_url: string | null }[]
  token: string
  consumerId: string
  consumerFollow: { id: string; created_at: string } | null
  state: 'CLAIMED' | 'TRAIL_COMPLETE'
  tastingNotes: TastingNote[]
  justSponsored: boolean
}

export function BarrelStoryClaimed(props: Props) {
  const { barrel, distillery, brandColor, voiceNote, sponsorships, token, consumerId, consumerFollow, state, tastingNotes, justSponsored } = props

  const claimDate = consumerFollow?.created_at ? new Date(consumerFollow.created_at) : null

  return (
    <div className="min-h-screen bg-black text-white">
      {justSponsored && (
        <div className="bg-[var(--brand)] text-white text-center py-3 text-sm font-medium" style={{ '--brand': brandColor } as React.CSSProperties}>
          Your sponsorship is confirmed — thank you for supporting this barrel.
        </div>
      )}

      {state === 'TRAIL_COMPLETE' && (
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 animate-pulse opacity-20" style={{ background: `radial-gradient(ellipse, ${brandColor}, transparent)` }} />
          <div className="relative z-10 text-center py-8 px-6">
            <div className="text-4xl mb-2">✦</div>
            <h2 className="text-xl font-bold">Trail Complete</h2>
            <p className="text-sm text-gray-300 mt-1">You've earned exclusive access to this barrel</p>
          </div>
        </div>
      )}

      <BarrelStoryHero barrel={barrel} distillery={distillery} brandColor={brandColor} />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-10">
        {claimDate && (
          <div className="flex items-center gap-3 p-4 rounded-xl border border-white/10 bg-white/5">
            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: brandColor }}>
              ✓
            </div>
            <div>
              <div className="text-sm font-medium">Your barrel, claimed {claimDate.toLocaleDateString()}</div>
              <div className="text-xs text-gray-400 mt-0.5">You'll be notified at every milestone</div>
            </div>
          </div>
        )}

        <AngelsShareStory barrel={barrel} brandColor={brandColor} />
        <AgeMilestoneTimeline barrel={barrel} brandColor={brandColor} />

        {voiceNote?.audio_url && (
          <div>
            <h2 className="text-lg font-medium mb-3">Distiller's Voice</h2>
            <VoiceNotePlayer audioUrl={voiceNote.audio_url} transcript={voiceNote.transcript} duration={voiceNote.duration_seconds} />
          </div>
        )}

        <div>
          <h2 className="text-lg font-medium mb-4">Tasting Notes</h2>
          <TastingNoteForm barrelId={barrel.id} consumerId={consumerId} distilleryId={barrel.distillery_id} />

          {tastingNotes.length > 0 && (
            <div className="mt-6 space-y-4">
              {tastingNotes.map((note) => (
                <div key={note.id} className="rounded-xl border border-white/10 p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{note.consumer_profiles?.display_name ?? 'Anonymous'}</span>
                    {note.rating && (
                      <div className="flex gap-0.5">
                        {Array.from({ length: 5 }, (_, i) => (
                          <span key={i} className={i < note.rating! ? 'text-yellow-400' : 'text-gray-600'}>★</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {note.notes && <p className="text-sm text-gray-300">{note.notes}</p>}
                  {note.flavor_tags && note.flavor_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {note.flavor_tags.map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-white/10 text-xs">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {sponsorships.length > 0 && (
          <div>
            <h2 className="text-sm text-gray-400 mb-2">Sponsors</h2>
            <SponsorshipBadges sponsorships={sponsorships} />
          </div>
        )}

        <ShareButton token={token} barrelNumber={barrel.barrel_number} distilleryName={distillery?.name ?? 'Still'} />
      </div>
    </div>
  )
}
