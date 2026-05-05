import { NextRequest, NextResponse } from 'next/server'
import { validateMasterRequest } from '@/lib/master-auth'
import { getUserById, setUserPassword, logAudit } from '@/lib/supabase-admin'

export async function POST(req: NextRequest, { params }: { params: { userId: string } }) {
  const auth = await validateMasterRequest(req)
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { password } = await req.json()
  if (!password || password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  const user = await getUserById(params.userId).catch(() => null)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  await setUserPassword(params.userId, password)

  await logAudit({
    adminUserId: auth.userId!,
    adminEmail: auth.email!,
    action: 'SET_PASSWORD',
    targetUserId: params.userId,
    targetEmail: user.email,
  })

  return NextResponse.json({ success: true })
}
