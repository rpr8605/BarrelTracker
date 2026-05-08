import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
import { validateStandardOfIdentity } from '@/lib/ttb/standards-of-identity'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const admin = createServiceClient()

  const distilleryId = await getMyDistilleryId(admin, user!.id, getActiveDistilleryId())

  let q = admin.from('barrels').select('*').eq('distillery_id', distilleryId ?? 'none')
  if (status) q = q.eq('status', status)

  const { data, error } = await q.order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  const validation = validateStandardOfIdentity({
    spirit_class: body.spirits_type ?? body.spirit_class ?? '',
    cooperage_code: body.cooperage_code,
    entry_proof: body.entry_proof,
    grain_bill: body.grain_bill,
  })

  if (!validation.valid) {
    return NextResponse.json(
      { error: 'Standards of identity violation', violations: validation.errors },
      { status: 422 }
    )
  }

  const admin = createServiceClient()
  const { data, error } = await admin.from('barrels').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
