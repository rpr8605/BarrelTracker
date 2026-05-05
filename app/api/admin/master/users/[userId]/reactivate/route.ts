import { NextRequest, NextResponse } from 'next/server'
import { validateMasterRequest } from '@/lib/master-auth'
import { getUserById, reactivateUser, logAudit } from '@/lib/supabase-admin'

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const auth = await validateMasterRequest(req)
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const user = await getUserById(params.userId).catch(() => null)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await reactivateUser(params.userId)

  await logAudit({
    adminUserId: auth.userId!,
    adminEmail: auth.email!,
    action: 'REACTIVATE_USER',
    targetUserId: params.userId,
    targetEmail: user.email,
  })

  return NextResponse.json({ reactivated: true })
}
