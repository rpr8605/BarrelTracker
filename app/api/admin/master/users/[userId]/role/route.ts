import { NextRequest, NextResponse } from 'next/server'
import { validateMasterRequest } from '@/lib/master-auth'
import { getUserById, updateUserMetadata, logAudit } from '@/lib/supabase-admin'

const VALID_ROLES = ['super_admin', 'distillery_owner', 'consumer']

export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const auth = await validateMasterRequest(req)
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { role } = await req.json()
  if (!VALID_ROLES.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const user = await getUserById(params.userId).catch(() => null)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const prevMeta = user.app_metadata ?? {}
  await updateUserMetadata(params.userId, { ...prevMeta, role })

  // Sync is_super_admin in user_profiles
  const { adminClient } = await import('@/lib/supabase-admin')
  const db = adminClient()
  await db.from('user_profiles')
    .update({ is_super_admin: role === 'super_admin' })
    .eq('id', params.userId)

  await logAudit({
    adminUserId: auth.userId!,
    adminEmail: auth.email!,
    action: 'CHANGE_ROLE',
    targetUserId: params.userId,
    targetEmail: user.email,
    metadata: { from: prevMeta.role, to: role },
  })

  return NextResponse.json({ success: true, role })
}
