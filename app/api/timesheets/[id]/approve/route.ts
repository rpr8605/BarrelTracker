import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'

export async function PATCH(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) return NextResponse.json({ error: 'no_distillery' }, { status: 400 })

  const db = createServiceClient()
  const { data, error } = await db.from('time_entries')
    .update({ approved_by: user.id, approved_at: new Date().toISOString() })
    .eq('id', params.id)
    .eq('distillery_id', distilleryId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ entry: data })
}
