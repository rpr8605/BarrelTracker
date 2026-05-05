'use client'

import { useEffect, useState } from 'react'
import { Bell, BellOff, BellRing } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface Props {
  distilleryId?: string
  barrelId?: string
  type: 'bottling' | 'milestone' | 'drop' | 'release'
  label?: string
}

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function PushSubscribeButton({ distilleryId, barrelId, type, label }: Props) {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check browser support on mount (client-only)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return
    setSupported(true)
    setPermission(Notification.permission)
  }, [])

  // Check current subscription status from server
  useEffect(() => {
    if (!supported) return

    const params = new URLSearchParams({ type })
    if (barrelId) params.set('barrel_id', barrelId)
    else if (distilleryId) params.set('distillery_id', distilleryId)

    fetch(`/api/push/status?${params.toString()}`)
      .then((r) => r.json())
      .then((data: { subscribed?: boolean }) => {
        if (typeof data.subscribed === 'boolean') setSubscribed(data.subscribed)
      })
      .catch(() => {})
  }, [supported, type, distilleryId, barrelId])

  if (!supported) return null

  if (permission === 'denied') {
    return (
      <Button variant="secondary" size="sm" disabled className="opacity-60 cursor-not-allowed">
        <BellOff className="w-4 h-4" />
        Notifications blocked
      </Button>
    )
  }

  async function handleClick() {
    setLoading(true)
    try {
      if (subscribed) {
        // Unsubscribe
        const body: Record<string, string> = { type }
        if (barrelId) body.barrel_id = barrelId
        else if (distilleryId) body.distillery_id = distilleryId

        const res = await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (res.ok) setSubscribed(false)
        return
      }

      // Request permission if not already granted
      if (Notification.permission !== 'granted') {
        const result = await Notification.requestPermission()
        setPermission(result)
        if (result !== 'granted') return
      }

      // Get SW registration and push subscription
      const reg = await navigator.serviceWorker.ready
      const pushSub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
      })

      const rawSub = pushSub.toJSON() as {
        endpoint: string
        keys: { p256dh: string; auth: string }
      }

      const body: Record<string, unknown> = {
        subscription: rawSub,
        type,
      }
      if (barrelId) body.barrel_id = barrelId
      else if (distilleryId) body.distillery_id = distilleryId

      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.ok) setSubscribed(true)
    } catch (err) {
      console.error('[push] subscription error:', err)
    } finally {
      setLoading(false)
    }
  }

  const defaultLabel =
    label ??
    (type === 'bottling'
      ? 'Notify on bottling'
      : type === 'milestone'
      ? 'Notify on milestones'
      : type === 'drop'
      ? 'Notify on drop'
      : 'Notify on release')

  return (
    <Button
      variant={subscribed ? 'primary' : 'secondary'}
      size="sm"
      loading={loading}
      onClick={handleClick}
      aria-pressed={subscribed}
      aria-label={subscribed ? `Stop ${defaultLabel.toLowerCase()}` : defaultLabel}
    >
      {subscribed ? (
        <BellRing className="w-4 h-4" />
      ) : (
        <Bell className="w-4 h-4" />
      )}
      {subscribed ? 'Subscribed' : defaultLabel}
    </Button>
  )
}
