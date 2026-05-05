'use client'

import { useState } from 'react'

interface Props {
  targetConsumerId: string
  initialFollowing: boolean
}

export function FollowConsumerButton({ targetConsumerId, initialFollowing }: Props) {
  const [following, setFollowing] = useState(initialFollowing)
  const [loading, setLoading] = useState(false)

  async function toggle() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/follows', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityType: 'consumer', entityId: targetConsumerId }),
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
      {following ? '♥ Following' : '♡ Follow'}
    </button>
  )
}
