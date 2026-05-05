import { createServiceClient } from '@/lib/supabase-server'
import { type PlanKey } from '@/lib/stripe'

export async function getDistilleryPlan(distilleryId: string): Promise<PlanKey> {
  const admin = createServiceClient()
  const { data } = await admin
    .from('subscriptions')
    .select('plan, status')
    .eq('distillery_id', distilleryId)
    .single()

  if (!data || data.status === 'canceled') return 'core'
  return (data.plan as PlanKey) || 'core'
}

export function planIncludes(plan: PlanKey, feature: 'story' | 'trail'): boolean {
  if (feature === 'story') return plan === 'story' || plan === 'trail'
  if (feature === 'trail') return plan === 'trail'
  return false
}
