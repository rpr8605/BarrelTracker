'use server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type {
  OnboardingStep,
  DistilleryProfileData,
  DSPRegistrationData,
  BondData,
  ProductionStationData,
  StorageStationData,
  ProcessingStationData,
  BarrelDefaultsData,
} from './schema'

async function requireDistillery() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')
  const admin = createServiceClient()
  const preferred = cookies().get('active_distillery')?.value
  const distilleryId = await getMyDistilleryId(admin, user.id, preferred)
  if (!distilleryId) redirect('/login')
  return { user, admin, distilleryId }
}

export async function getOnboardingState() {
  const { admin, distilleryId } = await requireDistillery()
  const { data: distillery } = await admin
    .from('distilleries')
    .select('id, name, is_demo, onboarding_completed, onboarding_step, onboarding_data')
    .eq('id', distilleryId)
    .single()
  return { distilleryId, distillery }
}

export async function saveStep1(data: DistilleryProfileData) {
  const { admin, distilleryId } = await requireDistillery()
  await admin
    .from('distilleries')
    .update({
      name: data.distillery_name,
      onboarding_step: 2,
      onboarding_data: { profile: data },
    })
    .eq('id', distilleryId)
  return { ok: true }
}

export async function saveStep2(data: DSPRegistrationData) {
  const { admin, distilleryId } = await requireDistillery()
  await admin.from('dsp_registration').upsert(
    {
      distillery_id: distilleryId,
      dsp_number: data.dsp_number,
      dsp_permit_date: data.dsp_permit_date || null,
      dsp_skipped: data.dsp_skipped ?? false,
      plant_name: data.plant_name,
      trade_name: data.trade_name,
      ein: data.ein,
      entity_type: data.entity_type,
      principal_name: data.principal_name,
      principal_title: data.principal_title,
      street_address: data.street_address,
      city: data.city,
      state: data.state,
      zip: data.zip,
      county: data.county,
      mailing_same: data.mailing_same,
      mailing_address: data.mailing_address,
      mailing_city: data.mailing_city,
      mailing_state: data.mailing_state,
      mailing_zip: data.mailing_zip,
      operations_type: data.operations_type ?? [],
      spirits_categories: data.spirits_categories ?? [],
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'distillery_id' },
  )
  if (data.dsp_number) {
    await admin.from('distilleries').update({ dsp_number: data.dsp_number }).eq('id', distilleryId)
  }
  await admin.from('distilleries').update({ onboarding_step: 3 }).eq('id', distilleryId)
  return { ok: true }
}

export async function saveStep3(data: BondData) {
  const { admin, distilleryId } = await requireDistillery()
  // Mark prior bonds inactive to keep a single active bond per distillery.
  await admin.from('dsp_bond').update({ is_active: false }).eq('distillery_id', distilleryId)
  await admin.from('dsp_bond').insert({
    distillery_id: distilleryId,
    bond_type: data.bond_type,
    bond_number: data.bond_number,
    surety_company: data.surety_company,
    bond_amount: data.bond_amount,
    penal_sum: data.penal_sum,
    effective_date: data.effective_date || null,
    expiration_date: data.expiration_date || null,
    renewal_required: data.renewal_required ?? true,
    notes: data.notes,
    is_active: true,
  })
  await admin.from('distilleries').update({ onboarding_step: 4 }).eq('id', distilleryId)
  return { ok: true }
}

export async function saveStep4(data: {
  production: ProductionStationData
  storage: StorageStationData
  processing: ProcessingStationData
}) {
  const { admin, distilleryId } = await requireDistillery()
  await Promise.all([
    admin.from('production_station').upsert(
      {
        distillery_id: distilleryId,
        fermenter_count: data.production.fermenter_count,
        fermenters: data.production.fermenters,
        typical_mash_size_gallons: data.production.typical_mash_size_gallons,
        typical_fermentation_days: data.production.typical_fermentation_days,
        stills: data.production.stills,
        water_source: data.production.water_source,
        grain_bill_templates: data.production.grain_bill_templates,
        yeast_types: data.production.yeast_types,
        proof_measurement_method: data.production.proof_measurement_method,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'distillery_id' },
    ),
    admin.from('storage_station').upsert(
      {
        distillery_id: distilleryId,
        warehouses: data.storage.warehouses,
        default_cooperage_code: data.storage.default_cooperage_code,
        default_oak_origin: data.storage.default_oak_origin,
        typical_barrel_sizes: data.storage.typical_barrel_sizes,
        typical_entry_proof_min: data.storage.typical_entry_proof_min,
        typical_entry_proof_max: data.storage.typical_entry_proof_max,
        annual_evaporation_rate_pct: data.storage.annual_evaporation_rate_pct,
        package_number_prefix: data.storage.package_number_prefix,
        package_number_sequence: data.storage.package_number_sequence,
        package_number_format: data.storage.package_number_format,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'distillery_id' },
    ),
    admin.from('processing_station').upsert(
      {
        distillery_id: distilleryId,
        bottle_sizes: data.processing.bottle_sizes,
        cola_approvals: data.processing.cola_approvals,
        gauging_method: data.processing.gauging_method,
        operations: data.processing.operations,
        typical_bottling_loss_pct: data.processing.typical_bottling_loss_pct,
        annual_proof_gallons_estimate: data.processing.annual_proof_gallons_estimate,
        tax_deferral_eligible: data.processing.tax_deferral_eligible,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'distillery_id' },
    ),
  ])
  await admin.from('distilleries').update({ onboarding_step: 5 }).eq('id', distilleryId)
  return { ok: true }
}

export async function saveStep5(data: BarrelDefaultsData) {
  const { admin, distilleryId } = await requireDistillery()
  const { data: distillery } = await admin
    .from('distilleries')
    .select('onboarding_data')
    .eq('id', distilleryId)
    .single()
  const existing = (distillery?.onboarding_data ?? {}) as Record<string, unknown>
  await admin
    .from('distilleries')
    .update({
      onboarding_data: { ...existing, barrel_defaults: data },
      onboarding_step: 5,
      onboarding_completed: true,
    })
    .eq('id', distilleryId)
  return { ok: true }
}

export async function setCurrentStep(step: OnboardingStep) {
  const { admin, distilleryId } = await requireDistillery()
  await admin.from('distilleries').update({ onboarding_step: step }).eq('id', distilleryId)
}
