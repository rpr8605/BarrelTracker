import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const distilleryId = searchParams.get('distillery_id')

  const { data: distilleries } = await supabase.from('distilleries').select('id').eq('owner_id', user.id)
  const ids = (distilleries || []).map((d) => d.id)

  let q = supabase.from('barrels').select('*').in('distillery_id', ids.length ? ids : ['none'])
  if (status) q = q.eq('status', status)
  if (distilleryId) q = q.eq('distillery_id', distilleryId)

  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { data, error } = await supabase.from('barrels').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
