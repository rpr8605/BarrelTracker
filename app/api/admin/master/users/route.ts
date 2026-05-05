import { NextRequest, NextResponse } from 'next/server'
import { validateMasterRequest } from '@/lib/master-auth'
import { listUsers, adminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest) {
  const auth = await validateMasterRequest(req)
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') ?? '1')
  const perPage = parseInt(searchParams.get('limit') ?? '25')

  try {
    const { users, total } = await listUsers({ page, perPage })

    // Merge with distillery data
    const db = adminClient()
    const { data: distilleries } = await db
      .from('distilleries')
      .select('owner_id, id, name, slug, plan')

    const distMap = Object.fromEntries((distilleries ?? []).map((d) => [d.owner_id, d]))

    const merged = users.map((u) => ({
      id: u.id,
      email: u.email,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
      banned_until: u.banned_until,
      app_metadata: u.app_metadata,
      user_metadata: u.user_metadata,
      distillery: distMap[u.id] ?? null,
    }))

    return NextResponse.json({ users: merged, total, page })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
