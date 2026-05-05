import { NextRequest, NextResponse } from 'next/server'
import { validateMasterRequest } from '@/lib/master-auth'
import { getUserById, suspendUser, logAudit } from '@/lib/supabase-admin'

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const auth = await validateMasterRequest(req)
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const user = await getUserById(params.userId).catch(() => null)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await suspendUser(params.userId)

  await logAudit({
    adminUserId: auth.userId!,
    adminEmail: auth.email!,
    action: 'SUSPEND_USER',
    targetUserId: params.userId,
    targetEmail: user.email,
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ suspended: true })
}
