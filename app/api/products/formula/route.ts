import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  if (!distilleryId) return NextResponse.json({ error: 'Missing distillery_id' }, { status: 400 })
  const admin = createServiceClient()
  const { data, error } = await admin.from('formula_records').select('*').eq('distillery_id', distilleryId).order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { distillery_id, product_name, spirit_class } = body
  if (!distillery_id || !product_name || !spirit_class)
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  const admin = createServiceClient()
  const { data, error } = await admin.from('formula_records').insert({
    distillery_id, product_name, spirit_class,
    formula_required: body.formula_required ?? true,
    formula_triggers: body.formula_triggers ?? [],
    ingredients: body.ingredients ?? [],
    status: 'not_submitted',
    version: 1,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
