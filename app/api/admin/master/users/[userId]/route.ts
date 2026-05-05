import { NextRequest, NextResponse } from 'next/server'
import { validateMasterRequest } from '@/lib/master-auth'
import { getUserById, adminClient } from '@/lib/supabase-admin'

export async function GET(req: NextRequest, { params }: { params: { userId: string } }) {
  const auth = await validateMasterRequest(req)
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const user = await getUserById(params.userId)
    const db = adminClient()

    const [distResult, auditResult] = await Promise.all([
      db.from('distilleries').select('id, name, slug, plan').eq('owner_id', params.userId).maybeSingle(),
      db.from('audit_log').select('*').eq('target_user_id', params.userId)
        .order('created_at', { ascending: false }).limit(50),
    ])

    return NextResponse.json({
      user,
      distillery: distResult.data,
      auditLog: auditResult.data ?? [],
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { userId: string } }) {
  const auth = await validateMasterRequest(req)
  if (!auth.ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  if (body.confirm !== 'DELETE') {
    return NextResponse.json({ error: 'Must confirm with DELETE' }, { status: 400 })
  }

  const { deleteUser, logAudit } = await import('@/lib/supabase-admin')
  const user = await getUserById(params.userId).catch(() => null)

  await deleteUser(params.userId)

  // Soft-delete distillery
  const db = adminClient()
  await db.from('distilleries').update({ is_demo: false }).eq('owner_id', params.userId)

  await logAudit({
    adminUserId: auth.userId!,
    adminEmail: auth.email!,
    action: 'DELETE_USER',
    targetUserId: params.userId,
    targetEmail: user?.email,
    ipAddress: req.headers.get('x-forwarded-for') ?? undefined,
  })

  return NextResponse.json({ deleted: true })
}
