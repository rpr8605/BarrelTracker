import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest, { params }: { params: { dropId: string } }) {
  try {
    const { name, email } = await req.json()
    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Upsert consumer_profile by email
    const { data: profile } = await supabase
      .from('consumer_profiles')
      .upsert({ email, name }, { onConflict: 'email' })
      .select('id')
      .single()

    const consumerId = profile?.id

    // Check if already on waitlist
    if (consumerId) {
      const { data: existing } = await supabase
        .from('drop_waitlist')
        .select('position')
        .eq('drop_event_id', params.dropId)
        .eq('consumer_id', consumerId)
        .maybeSingle()

      if (existing) {
        return NextResponse.json({ position: existing.position })
      }
    }

    // Get current count for position
    const { count } = await supabase
      .from('drop_waitlist')
      .select('*', { count: 'exact', head: true })
      .eq('drop_event_id', params.dropId)

    const position = (count ?? 0) + 1

    await supabase
      .from('drop_waitlist')
      .insert({
        drop_event_id: params.dropId,
        consumer_id: consumerId || null,
        email,
        position,
      })

    return NextResponse.json({ position })
  } catch (err) {
    console.error('Waitlist error:', err)
    return NextResponse.json({ error: 'Failed to join waitlist' }, { status: 500 })
  }
}
