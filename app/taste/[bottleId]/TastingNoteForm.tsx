'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/Input'

interface Props {
  bottleId: string
  barrelId?: string
  distilleryId?: string
  batchId?: string
  flavorTags: string[]
  storyUrl?: string
}

export function TastingNoteForm({ bottleId, barrelId, distilleryId, flavorTags, storyUrl }: Props) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [tagSearch, setTagSearch] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const visibleTags = tagSearch.trim()
    ? flavorTags.filter((t) => t.toLowerCase().includes(tagSearch.toLowerCase()))
    : flavorTags

  function toggleTag(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) { setError('Please select a rating'); return }
    setError(null)
    setLoading(true)
    try {
      const res = await fetch('/api/tasting-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bottleId, barrelId, distilleryId, rating, notes, flavorTags: selectedTags, name, email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Something went wrong'); return }
      setSubmitted(true)
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitted) {
    return (
      <div className="space-y-6 text-center py-6">
        <div className="text-5xl">🥃</div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold">Thank you!</h2>
          <p className="text-sm text-[#f5f0e8]/50">Your tasting note has been recorded.</p>
        </div>
        {storyUrl && (
          <Link
            href={storyUrl}
            className="inline-flex items-center justify-center w-full py-3 px-4 rounded-xl bg-[#BA7517] text-white font-medium text-sm hover:bg-[#a06413] transition-colors"
          >
            Read the full barrel story
          </Link>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Star rating */}
      <div className="space-y-2">
        <p className="text-sm font-medium">Your Rating</p>
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="text-3xl transition-transform hover:scale-110 active:scale-95"
              aria-label={`${star} star${star !== 1 ? 's' : ''}`}
            >
              <span className={(hoverRating || rating) >= star ? 'text-[#BA7517]' : 'text-white/15'}>
                ★
              </span>
            </button>
          ))}
          {rating > 0 && (
            <span className="text-sm text-[#f5f0e8]/40 ml-2">
              {['', 'Poor', 'Fair', 'Good', 'Great', 'Outstanding'][rating]}
            </span>
          )}
        </div>
      </div>

      {/* Tasting notes */}
      <div className="space-y-1">
        <label className="block text-sm font-medium">Tasting Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="What do you taste? Share anything — aromas, finish, how it made you feel..."
          className="w-full px-3 py-2.5 rounded-lg border border-white/10 text-[#f5f0e8] bg-white/5 placeholder:text-[#f5f0e8]/30 text-sm outline-none transition-all focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/30 resize-none"
        />
      </div>

      {/* Flavor tag picker */}
      <div className="space-y-3">
        <label className="block text-sm font-medium">Flavor Tags <span className="text-[#f5f0e8]/30 font-normal">(optional)</span></label>
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className="px-3 py-1 bg-[#BA7517]/20 text-[#BA7517] border border-[#BA7517]/40 rounded-full text-xs font-medium hover:bg-[#BA7517]/10 transition-colors"
              >
                {tag} ×
              </button>
            ))}
          </div>
        )}
        <input
          type="text"
          value={tagSearch}
          onChange={(e) => setTagSearch(e.target.value)}
          placeholder="Search flavors..."
          className="w-full px-3 py-2 rounded-lg border border-white/10 text-[#f5f0e8] bg-white/5 placeholder:text-[#f5f0e8]/30 text-sm outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/30"
        />
        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
          {visibleTags.slice(0, 60).map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-colors ${
                selectedTags.includes(tag)
                  ? 'bg-[#BA7517]/20 text-[#BA7517] border-[#BA7517]/40'
                  : 'bg-white/5 text-[#f5f0e8]/50 border-white/10 hover:bg-white/10 hover:text-[#f5f0e8]'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Identity — no account required */}
      <div className="space-y-4">
        <p className="text-xs text-[#f5f0e8]/40 uppercase tracking-widest font-medium">About You <span className="normal-case">(no account required)</span></p>
        <Input
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          className="bg-white/5 border-white/10 text-[#f5f0e8] placeholder:text-[#f5f0e8]/30 focus:border-[#BA7517]"
        />
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          autoComplete="email"
          className="bg-white/5 border-white/10 text-[#f5f0e8] placeholder:text-[#f5f0e8]/30 focus:border-[#BA7517]"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 px-4 rounded-xl bg-[#BA7517] text-white font-medium text-sm hover:bg-[#a06413] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
        Submit Tasting Note
      </button>

      <p className="text-xs text-[#f5f0e8]/30 text-center">Your note may be shared publicly on this barrel&apos;s story page.</p>
    </form>
  )
}
