'use client'
import { posthog } from '@/lib/posthog'

export function useTrack() {
  return function track(event: string, properties?: Record<string, unknown>) {
    if (typeof window === 'undefined') return
    if (!posthog.__loaded) return
    posthog.capture(event, properties)
  }
}
