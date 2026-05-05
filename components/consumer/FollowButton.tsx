'use client'

import { useState, useEffect } from 'react'
import { createBrowserClient } from '@supabase/ssr'

interface FollowButtonProps {
  entityType: 'distillery' | 'barrel'
  entityId: string
}

export function FollowButton({ entityType, entityId }: FollowButtonProps) {
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checked, setChecked] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

  const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  useEffect(() => {
    let cancelled = false
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (cancelled) return
      if (!user) {
        setLoggedIn(false)
        setChecked(true)
        return
      }
      setLoggedIn(true)
      const { data } = await supabase
        .from('follows')
        .select('id')
        .eq('user_id', user.id)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .maybeSingle()
      if (!cancelled) {
        setFollowing(!!data)
        setChecked(true)
      }
    }
    init()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityId, entityType])

  if (!checked) {
    return (
      <button
        disabled
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#BA7517]/40 text-[#BA7517] text-sm font-medium opacity-50 cursor-not-allowed"
      >
        <HeartIcon filled={false} />
        Follow
      </button>
    )
  }

  if (!loggedIn) {
    return (
      <a
        href="/signup"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-[#BA7517]/60 text-[#BA7517] text-sm font-medium hover:bg-[#BA7517]/10 transition-colors"
      >
        <HeartIcon filled={false} />
        Follow
      </a>
    )
  }

  async function toggle() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType, entityId }),
      })
      if (res.ok) {
        const json = await res.json()
        setFollowing(json.following)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={[
        'inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium transition-all',
        following
          ? 'bg-[#BA7517] text-white hover:bg-[#9e6413]'
          : 'border border-[#BA7517]/60 text-[#BA7517] hover:bg-[#BA7517]/10',
        loading ? 'opacity-60 cursor-not-allowed' : '',
      ].join(' ')}
    >
      <HeartIcon filled={following} />
      {following ? 'Following' : 'Follow'}
    </button>
  )
}

function HeartIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
      </svg>
    )
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  )
}
