import { notFound, redirect } from 'next/navigation'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
import { cookies } from 'next/headers'
import { Step1DistilleryProfile } from '@/components/onboarding/steps/Step1_DistilleryProfile'
import { Step2DSPRegistration } from '@/components/onboarding/steps/Step2_DSPRegistration'
import { Step3BondInformation } from '@/components/onboarding/steps/Step3_BondInformation'
import { Step4ComplianceStations } from '@/components/onboarding/steps/Step4_ComplianceStations'
import { Step5BarrelDefaults } from '@/components/onboarding/steps/Step5_BarrelDefaults'

export const dynamic = 'force-dynamic'

export default async function OnboardingStepPage({ params }: { params: { step: string } }) {
  const step = Number(params.step)
  if (![1, 2, 3, 4, 5].includes(step)) notFound()

  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = createServiceClient()
  const preferred = cookies().get('active_distillery')?.value
  const distilleryId = await getMyDistilleryId(admin, user.id, preferred)
  if (!distilleryId) redirect('/login')

  const { data: distillery } = await admin
    .from('distilleries')
    .select('id, name, is_demo, onboarding_completed, onboarding_data')
    .eq('id', distilleryId)
    .single()
  if (distillery?.is_demo) redirect('/dashboard')
  if (distillery?.onboarding_completed) redirect('/dashboard')

  if (step === 1) {
    const profile = (distillery?.onboarding_data as Record<string, unknown> | null)?.profile as
      | Record<string, unknown>
      | undefined
    return (
      <Step1DistilleryProfile
        email={user.email ?? ''}
        initial={{
          distillery_name: (profile?.distillery_name as string) ?? distillery?.name ?? '',
          trade_name: profile?.trade_name as string,
          website: profile?.website as string,
          phone: profile?.phone as string,
          email: (profile?.email as string) ?? user.email ?? '',
          founding_year: profile?.founding_year as number,
          description: profile?.description as string,
          spirits_produced: (profile?.spirits_produced as string[]) ?? [],
          barrel_count_estimate: profile?.barrel_count_estimate as number,
          state: (profile?.state as string) ?? '',
        }}
      />
    )
  }

  if (step === 2) {
    const { data: dsp } = await admin
      .from('dsp_registration')
      .select('*')
      .eq('distillery_id', distilleryId)
      .maybeSingle()
    return <Step2DSPRegistration initial={dsp ?? undefined} />
  }

  if (step === 3) {
    const { data: bond } = await admin
      .from('dsp_bond')
      .select('*')
      .eq('distillery_id', distilleryId)
      .eq('is_active', true)
      .maybeSingle()
    return <Step3BondInformation initial={bond ?? undefined} />
  }

  if (step === 4) return <Step4ComplianceStations />

  if (step === 5) {
    const [{ data: storage }, { data: prod }] = await Promise.all([
      admin.from('storage_station').select('*').eq('distillery_id', distilleryId).maybeSingle(),
      admin.from('production_station').select('*').eq('distillery_id', distilleryId).maybeSingle(),
    ])
    const warehouses = (storage?.warehouses ?? []).map((w: { name: string }) => w.name)
    const templates = (prod?.grain_bill_templates ?? []).map((t: { name: string }) => t.name)
    const midProof = storage
      ? Math.round(
          (Number(storage.typical_entry_proof_min ?? 100) + Number(storage.typical_entry_proof_max ?? 125)) / 2,
        )
      : undefined
    return (
      <Step5BarrelDefaults
        warehouses={warehouses}
        templates={templates}
        proofDefault={midProof}
        cooperageDefault={storage?.default_cooperage_code ?? 'C'}
      />
    )
  }

  notFound()
}
