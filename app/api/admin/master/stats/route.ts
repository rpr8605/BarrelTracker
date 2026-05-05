import { NextRequest, NextResponse } from 'next/server'
import { validateMasterRequest } from '@/lib/master-auth'
import { listUsers, adminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = await validateMasterRequest(req)
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { users, total } = await listUsers({ page: 1, perPage: 1000 })
    const db = adminClient()

    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString()

    const distilleryOwners = users.filter(
      (u) => u.app_metadata?.role === 'distillery_owner'
    ).length
    const consumers = users.filter(
      (u) => !u.app_metadata?.role || u.app_metadata?.role === 'consumer'
    ).length
    const suspended = users.filter((u) => u.banned_until).length
    const newLast30 = users.filter((u) => u.created_at > thirtyDaysAgo).length

    const [barrelsResult, followsResult, sponsorshipsResult] = await Promise.all([
      db.from('barrels').select('id', { count: 'exact', head: true }),
      db.from('follows').select('id', { count: 'exact', head: true }),
      db.from('sponsorships').select('amount_cents').eq('status', 'ACTIVE'),
    ])

    const totalBarrels = barrelsResult.count ?? 0
    const totalFollowers = followsResult.count ?? 0
    const totalSponsorships = sponsorshipsResult.data?.length ?? 0
    const platformMrr = (sponsorshipsResult.data ?? []).reduce(
      (sum, s) => sum + (s.amount_cents ?? 0),
      0
    )

    return NextResponse.json({
      totalUsers: total,
      distilleryOwners,
      consumers,
      suspended,
      platformMrr,
      totalBarrels,
      totalFollowers,
      totalSponsorships,
      newUsersLast30Days: newLast30,
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
