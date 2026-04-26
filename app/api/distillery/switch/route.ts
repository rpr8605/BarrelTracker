import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { distilleryId } = await req.json()

  // Verify user actually has access to this distillery
  const myId = await getMyDistilleryId(supabase, user.id)
  const { data: roleCheck } = await supabase
    .from('user_roles')
    .select('distillery_id')
    .eq('user_id', user.id)
    .eq('distillery_id', distilleryId)
    .single()

  const isOwned = myId === distilleryId
  if (!isOwned && !roleCheck) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('active_distillery', distilleryId, {
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: true,
    sameSite: 'lax',
  })
  return res
}
