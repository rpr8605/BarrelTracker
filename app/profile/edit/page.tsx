'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'

export default function ProfileEditPage() {
  const router = useRouter()
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    fetch('/api/profile')
      .then((r) => {
        if (r.status === 401) {
          router.replace('/login?next=/profile/edit')
          return null
        }
        return r.json()
      })
      .then((data) => {
        if (!data) return
        if (data.profile) {
          setDisplayName(data.profile.display_name ?? '')
          setBio(data.profile.bio ?? '')
          setAvatarUrl(data.profile.avatar_url ?? '')
        }
        setFetching(false)
      })
      .catch(() => setFetching(false))
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!displayName.trim()) return
    setLoading(true)
    setError('')
    setSuccess(false)
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          display_name: displayName,
          bio: bio || null,
          avatar_url: avatarUrl || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Update failed')
      } else {
        setSuccess(true)
        const slug = data.profile.display_name.toLowerCase().replace(/\s+/g, '-')
        setTimeout(() => router.push(`/profile/${slug}`), 800)
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <div className="w-8 h-8 border-2 border-[#BA7517] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg)] p-4 max-w-md mx-auto pt-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Edit Profile</h1>
        <p className="text-sm text-[var(--color-text-muted)] mt-1">Visible to other Still members</p>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-4">
        <Input
          label="Display name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="Your name"
          autoComplete="name"
          required
        />

        <div className="space-y-1">
          <label className="block text-sm font-medium text-[var(--color-text-muted)]">
            Bio <span className="text-[var(--color-text-muted)] font-normal">({bio.length}/200)</span>
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value.slice(0, 200))}
            placeholder="Whiskey lover, amateur blender…"
            rows={3}
            className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-secondary)] text-[var(--color-text)] px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[#BA7517]/40"
          />
        </div>

        <Input
          label="Avatar URL (optional)"
          value={avatarUrl}
          onChange={(e) => setAvatarUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg"
          type="url"
        />

        {error && <p className="text-sm text-danger">{error}</p>}
        {success && <p className="text-sm text-green-500">Saved! Redirecting…</p>}

        <Button
          type="submit"
          loading={loading}
          disabled={!displayName.trim() || loading}
          className="w-full"
          size="lg"
        >
          Save changes
        </Button>
      </form>
    </div>
  )
}
