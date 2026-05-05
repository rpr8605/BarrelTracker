import { createServiceClient } from '@/lib/supabase-server'
import { CrmKanban } from '@/components/admin/CrmKanban'

export const revalidate = 0

export default async function AdminClientsPage() {
  const db = createServiceClient()
  const { data: clients } = await db
    .from('crm_clients')
    .select('*')
    .order('updated_at', { ascending: false })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-medium text-[var(--color-text)]">Client Pipeline</h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-0.5">{clients?.length ?? 0} total contacts</p>
        </div>
        <a href="/admin/clients/new" className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-all min-h-[44px] flex items-center">
          + Add prospect
        </a>
      </div>
      <CrmKanban initialClients={clients ?? []} />
    </div>
  )
}
