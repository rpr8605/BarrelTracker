import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const admin = createServiceClient()

  // Verify ownership
  const { data: record } = await admin.from('formula_records')
    .select('distillery_id, status, version, id, product_name, spirit_class, formula_required, formula_triggers, ingredients')
    .eq('id', params.id).single()
  if (!record) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const { data: dist } = await admin.from('distilleries').select('id').eq('id', record.distillery_id).eq('owner_id', user.id).single()
  if (!dist) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })

  // If approved and ingredients are being changed, create a new version
  const isChangingIngredients = body.ingredients !== undefined
  if (record.status === 'approved' && isChangingIngredients) {
    const { data: newVersion, error: newErr } = await admin.from('formula_records').insert({
      distillery_id: record.distillery_id,
      product_name: record.product_name,
      spirit_class: record.spirit_class,
      formula_required: record.formula_required,
      formula_triggers: record.formula_triggers,
      ingredients: body.ingredients,
      status: 'not_submitted',
      version: record.version + 1,
      previous_version_id: record.id,
      change_description: body.change_description ?? null,
    }).select().single()
    if (newErr) return NextResponse.json({ error: newErr.message }, { status: 500 })
    return NextResponse.json({ ...newVersion, versioned: true })
  }

  const { id: _id, distillery_id: _did, created_at: _ca, ...safeUpdates } = body
  const { data, error } = await admin.from('formula_records').update(safeUpdates).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
