'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface Barrel {
  barrel_number: string
  grain_type: string | null
  status: string | null
  entry_date: string | null
}

interface Distillery {
  name: string
}

interface Adoption {
  id: string
  barrel_id: string | null
  distillery_id: string | null
  tier: string | null
  share_number: number | null
  price_paid: number | null
  status: string | null
  adopted_at: string
  barrels: Barrel | null
  distilleries: Distillery | null
}

interface BottleRef {
  bottle_number: number | null
  qr_token: string | null
}

interface BarrelRef {
  barrel_number: string | null
}

interface TastingNote {
  id: string
  barrel_id: string | null
  bottle_id: string | null
  rating: number
  notes: string | null
  flavor_tags: string[] | null
  created_at: string
  bottles: BottleRef | null
  barrels: BarrelRef | null
}

function ratingStars(rating: number) {
  return Array.from({ length: 5 }, (_, i) => (i < rating ? '★' : '☆')).join('')
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function CollectionPage() {
  const router = useRouter()
  const [adoptions, setAdoptions] = useState<Adoption[]>([])
  const [tastingNotes, setTastingNotes] = useState<TastingNote[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/collection')
      .then((r) => {
        if (r.status === 401) {
          router.replace('/login?next=/collection')
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        setAdoptions(data.adoptions ?? [])
        setTastingNotes(data.tasting_notes ?? [])
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="w-8 h-8 border-2 border-[#BA7517] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4 max-w-2xl mx-auto space-y-8 pb-28">
      <div className="pt-4">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">My Collection</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Barrels and bottles you've claimed</p>
      </div>

      {/* Adopted Barrels */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
          My Adopted Barrels
        </h2>
        {adoptions.length === 0 ? (
          <div className="card p-6 text-center space-y-3">
            <p className="text-[var(--color-text-muted)] text-sm">You haven't adopted any barrels yet.</p>
            <Link
              href="/barrels"
              className="inline-flex items-center gap-1 text-[#BA7517] text-sm font-medium hover:underline"
            >
              Explore barrels to adopt →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {adoptions.map((a) => (
              <div key={a.id} className="card p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium text-[var(--color-text)]">
                      Barrel #{a.barrels?.barrel_number ?? '—'}
                    </div>
                    <div className="text-sm text-[var(--color-text-muted)] mt-0.5">
                      {a.distilleries?.name ?? 'Unknown distillery'}
                    </div>
                    {a.barrels?.grain_type && (
                      <div className="text-xs text-[var(--color-text-muted)] mt-0.5">
                        {a.barrels.grain_type}
                      </div>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span
                      className={[
                        'inline-block px-2 py-0.5 rounded-full text-xs font-medium',
                        a.tier === 'full'
                          ? 'bg-[#BA7517]/20 text-[#BA7517]'
                          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]',
                      ].join(' ')}
                    >
                      {a.tier === 'full' ? 'Full barrel' : `Share #${a.share_number ?? ''}`}
                    </span>
                    <div className="text-xs text-[var(--color-text-muted)] mt-1">
                      {a.status ?? 'active'}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-2">
                  Adopted {formatDate(a.adopted_at)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Tasting Notes */}
      <section>
        <h2 className="text-sm font-semibold text-[var(--color-text-muted)] uppercase tracking-wide mb-3">
          My Tasting Notes
        </h2>
        {tastingNotes.length === 0 ? (
          <div className="card p-6 text-center">
            <p className="text-[var(--color-text-muted)] text-sm">
              Scan a bottle QR to leave your first note
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {tastingNotes.map((note) => (
              <div key={note.id} className="card p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    {note.barrels?.barrel_number && (
                      <span className="text-sm text-[var(--color-text)] font-medium">
                        Barrel #{note.barrels.barrel_number}
                      </span>
                    )}
                    {note.bottles?.bottle_number && (
                      <span className="text-sm text-[var(--color-text-muted)] ml-2">
                        · Bottle #{note.bottles.bottle_number}
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {formatDate(note.created_at)}
                  </span>
                </div>
                <div className="text-[#BA7517] text-sm tracking-wide">{ratingStars(note.rating)}</div>
                {note.flavor_tags && note.flavor_tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {note.flavor_tags.slice(0, 6).map((tag) => (
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

      {/* Floating add button */}
      <Link
        href="/taste/new"
        className="fixed bottom-20 right-4 w-14 h-14 bg-[#BA7517] rounded-full flex items-center justify-center text-white text-2xl shadow-lg hover:bg-[#9e6413] transition-colors z-10"
        aria-label="Add tasting note"
      >
        +
      </Link>
    </div>
  )
}
