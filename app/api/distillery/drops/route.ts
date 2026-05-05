import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const activeDistillery = cookies().get('active_distillery')?.value
    const distilleryId = await getMyDistilleryId(supabase, user.id, activeDistillery)
    if (!distilleryId) return NextResponse.json({ error: 'No distillery' }, { status: 400 })

    const { data, error } = await supabase
      .from('drop_events')
      .select('*')
      .eq('distillery_id', distilleryId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('GET drops error:', err)
    return NextResponse.json({ error: 'Failed to fetch drops' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const activeDistillery = cookies().get('active_distillery')?.value
    const distilleryId = await getMyDistilleryId(supabase, user.id, activeDistillery)
    if (!distilleryId) return NextResponse.json({ error: 'No distillery' }, { status: 400 })

    const body = await req.json()
    const { title, description, barrel_id, batch_id, total_bottles, price_per_bottle, opens_at, closes_at } = body

    if (!title || !total_bottles || !price_per_bottle || !opens_at) {
      return NextResponse.json({ error: 'Missing required fields (title, total_bottles, price_per_bottle, opens_at)' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('drop_events')
      .insert({
        distillery_id: distilleryId,
        title,
        description: description || null,
        barrel_id: barrel_id || null,
        batch_id: batch_id || null,
        total_bottles: Number(total_bottles),
        bottles_remaining: Number(total_bottles),
        price_per_bottle: Number(price_per_bottle),
        opens_at: new Date(opens_at).toISOString(),
        closes_at: closes_at ? new Date(closes_at).toISOString() : null,
        status: 'waitlist',
      })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    console.error('POST drops error:', err)
    return NextResponse.json({ error: 'Failed to create drop' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { id, ...updates } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { data, error } = await supabase
      .from('drop_events')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return NextResponse.json(data)
  } catch (err) {
    console.error('PATCH drops error:', err)
    return NextResponse.json({ error: 'Failed to update drop' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const supabase = createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    const { error } = await supabase.from('drop_events').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('DELETE drops error:', err)
    return NextResponse.json({ error: 'Failed to delete drop' }, { status: 500 })
  }
}
