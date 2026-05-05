import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { seedDemoData } from '@/lib/demo-seed'

export async function POST() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data: profile } = await db.from('user_profiles').select('is_super_admin').eq('id', user.id).single()
  if (!profile?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Delete demo distillery (cascades to all related data)
  const { data: existing } = await db.from('distilleries').select('id').eq('is_demo', true).eq('slug', 'demo').single()
  if (existing) {
    await db.from('barrel_qr_events').delete().eq('distillery_id', existing.id)
    await db.from('sponsorships').delete().eq('distillery_id', existing.id)
    await db.from('barrels').delete().eq('distillery_id', existing.id)
    await db.from('distilleries').delete().eq('id', existing.id)
  }

  const { existing: hadExisting } = await seedDemoData(db)
  return NextResponse.json({ message: `Demo reset and reseeded. ${hadExisting ? '' : '(Was already clean)'}` })
}
