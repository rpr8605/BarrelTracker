import type { SupabaseClient } from '@supabase/supabase-js'

interface TriggerOptions {
  distilleryId: string
  alertType: 'first_tib_inbound' | 'permit_expiring' | 'permit_expired' | 'filed_period_record_edited' | 'bond_renewal'
  title: string
  description?: string
  relatedId?: string
  relatedType?: string
  severity?: 'info' | 'warning' | 'critical'
  supabase: SupabaseClient
}

export async function fireTrigger(opts: TriggerOptions): Promise<void> {
  const { distilleryId, alertType, title, description, relatedId, relatedType, severity = 'warning', supabase } = opts

  // Dedup: skip if a pending alert already exists for this distillery + type + related record
  let query = supabase
    .from('amendment_alerts')
    .select('id')
    .eq('distillery_id', distilleryId)
    .eq('alert_type', alertType)
    .eq('status', 'pending')

  if (relatedId) query = query.eq('related_id', relatedId)

  const { data: existing } = await query.limit(1)
  if (existing && existing.length > 0) return

  await supabase.from('amendment_alerts').insert({
    distillery_id: distilleryId,
    alert_type: alertType,
    title,
    description: description ?? null,
    related_id: relatedId ?? null,
    related_type: relatedType ?? null,
    severity,
    status: 'pending',
  })
}
