'use client'
import { useState } from 'react'

const FLAVOR_TAGS = ['vanilla', 'caramel', 'oak', 'smoke', 'fruit', 'floral', 'spice', 'grain', 'honey', 'chocolate', 'leather', 'dried fruit', 'citrus', 'mint', 'nutmeg']
const PROFANITY = ['fuck', 'shit', 'ass', 'bitch', 'cunt', 'damn', 'piss']

interface Props {
  barrelId: string
  consumerId: string
  distilleryId: string
}

export function TastingNoteForm({ barrelId, consumerId, distilleryId }: Props) {
  const [rating, setRating] = useState(0)
  const [hovered, setHovered] = useState(0)
  const [text, setText] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  function toggleTag(tag: string) {
    setTags((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag])
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!rating) { setError('Please select a rating'); return }
    const lower = text.toLowerCase()
    if (PROFANITY.some((w) => lower.includes(w))) { setError('Please keep notes respectful'); return }
    setSubmitting(true)
    setError('')
    const res = await fetch('/api/tasting-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ barrelId, consumerId, distilleryId, rating, notes: text.trim() || null, flavorTags: tags }),
    })
    if (res.ok) {
      setDone(true)
    } else {
      setError('Failed to save note')
    }
    setSubmitting(false)
  }

  if (done) {
    return (
      <div className="rounded-xl border border-white/10 p-4 text-center">
        <div className="text-2xl mb-1">✓</div>
        <p className="text-sm text-gray-300">Your tasting note was saved</p>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="rounded-xl border border-white/10 p-4 space-y-4">
      <div className="text-sm font-medium">Add your tasting note</div>

      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(star)}
            className="text-2xl transition-colors"
          >
            <span className={(hovered || rating) >= star ? 'text-yellow-400' : 'text-gray-600'}>★</span>
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value.slice(0, 200))}
        maxLength={200}
        placeholder="Describe what you taste..."
        className="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-sm resize-none min-h-[80px] focus:outline-none focus:border-white/30 text-white placeholder-gray-600"
      />
      <div className="text-xs text-gray-600 text-right">{text.length}/200</div>

      <div>
        <div className="text-xs text-gray-500 mb-2">Flavor notes</div>
        <div className="flex flex-wrap gap-1.5">
          {FLAVOR_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-full text-xs border transition-all ${
                tags.includes(tag)
                  ? 'border-white/50 bg-white/10 text-white'
                  : 'border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-2.5 rounded-lg bg-white text-black text-sm font-semibold hover:bg-gray-100 transition-all disabled:opacity-50 min-h-[44px]"
      >
        {submitting ? 'Saving...' : 'Save tasting note'}
      </button>
    </form>
  )
}
