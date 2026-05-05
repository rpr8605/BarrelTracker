import webpush from 'web-push'
import { createServiceClient } from '@/lib/supabase-server'

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY || ''
const VAPID_MAILTO =
  process.env.VAPID_MAILTO || 'mailto:hello@stilldistillery.app'

const PUSH_CONFIGURED = !!VAPID_PUBLIC && !!VAPID_PRIVATE

if (PUSH_CONFIGURED) {
  webpush.setVapidDetails(VAPID_MAILTO, VAPID_PUBLIC, VAPID_PRIVATE)
}

export interface PushPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  url?: string
  tag?: string
}

/**
 * Send a push notification to a single subscription.
 * Returns false if the subscription is expired (410) or if VAPID is not configured.
 */
export async function sendPushNotification(
  endpoint: string,
  keys: { p256dh: string; auth: string },
  payload: PushPayload
): Promise<{ sent: boolean; expired: boolean }> {
  if (!PUSH_CONFIGURED) {
    console.log('[push] VAPID not configured — skipping push:', payload.title)
    return { sent: false, expired: false }
  }

  try {
    await webpush.sendNotification(
      { endpoint, keys },
      JSON.stringify(payload)
    )
    return { sent: true, expired: false }
  } catch (err: unknown) {
    const statusCode = (err as { statusCode?: number }).statusCode
    if (statusCode === 410) {
      return { sent: false, expired: true }
    }
    console.error('[push] sendNotification error:', err)
    return { sent: false, expired: false }
  }
}

/**
 * Send push notifications to all subscribers of a given type for a distillery.
 * Automatically removes expired subscriptions (410 responses).
 */
export async function notifyDistillerySubscribers(
  distilleryId: string,
  type: 'bottling' | 'milestone' | 'drop' | 'release',
  payload: PushPayload
): Promise<void> {
  const db = createServiceClient()

  const { data: subs, error } = await db
    .from('notification_subscriptions')
    .select('id, push_endpoint')
    .eq('distillery_id', distilleryId)
    .eq('type', type)
    .not('push_endpoint', 'is', null)

  if (error || !subs || subs.length === 0) return

  const expiredIds: string[] = []

  await Promise.all(
    subs.map(async (sub: { id: string; push_endpoint: string }) => {
      let parsed: { endpoint: string; keys: { p256dh: string; auth: string } }
      try {
        parsed = JSON.parse(sub.push_endpoint)
      } catch {
        return
      }

      const { expired } = await sendPushNotification(
        parsed.endpoint,
        parsed.keys,
        payload
      )

      if (expired) {
        expiredIds.push(sub.id)
      }
    })
  )

  if (expiredIds.length > 0) {
    await db
      .from('notification_subscriptions')
      .delete()
      .in('id', expiredIds)
  }
}
