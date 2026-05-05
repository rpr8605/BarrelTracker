import { validateMasterAccess } from '@/lib/master-auth'
import { redirect } from 'next/navigation'
import { MasterDashboard } from './_components/MasterDashboard'
import { listUsers, adminClient } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export default async function MasterPage() {
  const auth = await validateMasterAccess()
  if (!auth.ok) redirect('/dashboard')

  const [usersData, statsData] = await Promise.all([
    listUsers({ page: 1, perPage: 25 }).catch(() => ({ users: [], total: 0 })),
    fetchStats(),
  ])

  return (
    <MasterDashboard
      adminEmail={auth.email ?? ''}
      initialUsers={usersData.users as never[]}
      initialTotal={usersData.total}
      initialStats={statsData}
    />
  )
}

async function fetchStats() {
  try {
    const { users } = await listUsers({ page: 1, perPage: 1000 })
    const db = adminClient()
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const [barrelsR, followsR, sponsorshipsR] = await Promise.all([
      db.from('barrels').select('id', { count: 'exact', head: true }),
      db.from('follows').select('id', { count: 'exact', head: true }),
      db.from('sponsorships').select('amount_cents').eq('status', 'ACTIVE'),
    ])

    return {
      totalUsers: users.length,
      distilleryOwners: users.filter((u) => u.app_metadata?.role === 'distillery_owner').length,
      consumers: users.filter((u) => !u.app_metadata?.role || u.app_metadata.role === 'consumer').length,
      suspended: users.filter((u) => u.banned_until).length,
      newUsersLast30Days: users.filter((u) => u.created_at > thirtyDaysAgo).length,
      totalBarrels: barrelsR.count ?? 0,
      totalFollowers: followsR.count ?? 0,
      totalSponsorships: sponsorshipsR.data?.length ?? 0,
      platformMrr: (sponsorshipsR.data ?? []).reduce((s, x) => s + (x.amount_cents ?? 0), 0),
    }
  } catch {
    return { totalUsers: 0, distilleryOwners: 0, consumers: 0, suspended: 0, newUsersLast30Days: 0, totalBarrels: 0, totalFollowers: 0, totalSponsorships: 0, platformMrr: 0 }
  }
}
