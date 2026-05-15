import { redirect } from 'next/navigation'
import { getOnboardingState } from '@/lib/onboarding/actions'

export const dynamic = 'force-dynamic'

export default async function OnboardingRootPage() {
  const { distillery } = await getOnboardingState()
  if (distillery?.onboarding_completed) redirect('/dashboard')
  if (distillery?.is_demo) redirect('/dashboard')
  const step = Math.max(1, Math.min(5, distillery?.onboarding_step ?? 1))
  redirect(`/onboarding/${step}`)
}
