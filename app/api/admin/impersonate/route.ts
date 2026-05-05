import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data: profile } = await db.from('user_profiles').select('is_super_admin').eq('id', user.id).single()
  if (!profile?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { distilleryId, distilleryName } = await req.json()
  if (!distilleryId) return NextResponse.json({ error: 'Missing distilleryId' }, { status: 400 })

  const res = NextResponse.json({ ok: true })
  const maxAge = 60 * 60 * 8 // 8 hours
  res.cookies.set('viewing_as_distillery_id', distilleryId, { maxAge, path: '/', sameSite: 'lax' })
  res.cookies.set('viewing_as_distillery_name', distilleryName ?? '', { maxAge, path: '/', sameSite: 'lax' })
  return res
}
