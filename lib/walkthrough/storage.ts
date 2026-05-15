import { createClient } from '@/lib/supabase'

export interface WalkthroughState {
  currentStep: number
  completedSteps: number[]
  completedAt: string | null
  dismissedAt: string | null
}

export async function getWalkthroughState(userId: string): Promise<WalkthroughState | null> {
  const supabase = createClient()
  const { data } = await supabase
    .from('walkthrough_progress')
    .select('current_step, completed_steps, completed_at, dismissed_at')
    .eq('user_id', userId)
    .eq('tour_id', 'main')
    .maybeSingle()
  if (!data) return null
  return {
    currentStep: data.current_step ?? 0,
    completedSteps: data.completed_steps ?? [],
    completedAt: data.completed_at,
    dismissedAt: data.dismissed_at,
  }
}

export async function saveWalkthroughProgress(
  userId: string,
  payload: { current_step?: number; completed_steps?: number[]; completed_at?: string | null; dismissed_at?: string | null; distillery_id?: string },
) {
  const supabase = createClient()
  await supabase
    .from('walkthrough_progress')
    .upsert(
      { user_id: userId, tour_id: 'main', ...payload, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,tour_id' },
    )
}
