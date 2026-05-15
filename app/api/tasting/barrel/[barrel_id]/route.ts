import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'

export async function GET(_req: Request, { params }: { params: { barrel_id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) return NextResponse.json({ error: 'no_distillery' }, { status: 400 })

  const db = createServiceClient()
  const { data: sessions, error } = await db
    .from('tasting_sessions')
    .select('*, tasting_notes(category, descriptors)')
    .eq('barrel_id', params.barrel_id)
    .eq('distillery_id', distilleryId)
    .order('sampled_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ sessions: sessions || [] })
}
