import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
import { HeatMap } from '@/components/warehouse/HeatMap'
import type { Barrel } from '@/types/database'

export default async function WarehousePage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()

  const distilleryId = await getMyDistilleryId(admin, user!.id, getActiveDistilleryId())

  const { data: barrels } = await admin
    .from('barrels')
    .select('*')
    .eq('distillery_id', distilleryId ?? 'none')
    .not('warehouse_row', 'is', null)

  const allBarrels = (barrels || []) as Barrel[]

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="font-medium text-lg">Warehouse</h1>
        <span className="text-sm text-[var(--color-text-muted)]">{allBarrels.length} barrels mapped</span>
      </div>

      {allBarrels.length === 0 ? (
        <div className="text-center py-16 text-[var(--color-text-muted)]">
          <div className="text-3xl mb-2">▦</div>
          <p className="text-sm">No barrels have warehouse locations assigned yet</p>
          <p className="text-xs mt-1">Add row, slot, and tier when logging a barrel</p>
        </div>
      ) : (
        <HeatMap barrels={allBarrels} />
      )}
    </div>
  )
}
