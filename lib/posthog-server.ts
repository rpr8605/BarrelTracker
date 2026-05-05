import { PostHog } from 'posthog-node'
import { POSTHOG_KEY, POSTHOG_HOST } from './posthog'

let _client: PostHog | null = null

export function getPostHogServer(): PostHog | null {
  if (!POSTHOG_KEY) return null
  if (!_client) {
    _client = new PostHog(POSTHOG_KEY, { host: POSTHOG_HOST, flushAt: 1, flushInterval: 0 })
  }
  return _client
}

export async function trackServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
): Promise<void> {
  const client = getPostHogServer()
  if (!client) return
  client.capture({ distinctId, event, properties })
  await client.flush()
}
