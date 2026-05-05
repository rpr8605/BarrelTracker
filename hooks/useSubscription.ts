'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase'
import type { PlanKey } from '@/lib/stripe'

export function useSubscription(distilleryId: string | null) {
  const [plan, setPlan] = useState<PlanKey>('core')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!distilleryId) { setLoading(false); return }
    const supabase = createClient()
    supabase
      .from('subscriptions')
      .select('plan, status')
      .eq('distillery_id', distilleryId)
      .single()
      .then(({ data }) => {
        if (data && data.status !== 'canceled') setPlan(data.plan as PlanKey)
        setLoading(false)
      })
  }, [distilleryId])

  return {
    plan,
    loading,
    hasStory: plan === 'story' || plan === 'trail',
    hasTrail: plan === 'trail',
  }
}
