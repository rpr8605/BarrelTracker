import { NextRequest, NextResponse } from 'next/server'
import { validateMasterRequest } from '@/lib/master-auth'
import { getUserById, generateMagicLink, logAudit } from '@/lib/supabase-admin'

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const auth = await validateMasterRequest(req)
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const user = await getUserById(params.userId).catch(() => null)
  if (!user?.email) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const url = await generateMagicLink(user.email)
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()

  await logAudit({
    adminUserId: auth.userId!,
    adminEmail: auth.email!,
    action: 'GENERATE_MAGIC_LINK',
    targetUserId: params.userId,
    targetEmail: user.email,
  })

  return NextResponse.json({ url, expiresAt })
}
