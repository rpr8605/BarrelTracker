import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { bottleId, barrelId, distilleryId, rating, notes, flavorTags, name, email } = body

  if (!bottleId || !rating || typeof rating !== 'number' || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'bottleId and a 1-5 rating are required' }, { status: 400 })
  }

  // Verify bottle exists
  const { data: bottle } = await admin.from('bottles').select('id').eq('id', bottleId).single()
  if (!bottle) return NextResponse.json({ error: 'Bottle not found' }, { status: 404 })

  // Find or create consumer_profile by email
  let consumerProfileId: string | null = null
  if (email) {
    const { data: existing } = await admin
      .from('consumer_profiles')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single()

    if (existing) {
      consumerProfileId = existing.id
      // Update name if provided and different
      if (name) {
        await admin.from('consumer_profiles').update({ name, updated_at: new Date().toISOString() }).eq('id', existing.id)
      }
    } else {
      const { data: created } = await admin
        .from('consumer_profiles')
        .insert({
          email: email.toLowerCase().trim(),
          name: name || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      consumerProfileId = created?.id ?? null
    }
  }

  const { error } = await admin.from('tasting_notes').insert({
    bottle_id: bottleId,
    barrel_id: barrelId ?? null,
    distillery_id: distilleryId ?? null,
    consumer_profile_id: consumerProfileId,
    rating,
    notes: notes || null,
    flavor_tags: flavorTags ?? [],
    submitted_name: name || null,
    submitted_email: email ? email.toLowerCase().trim() : null,
    created_at: new Date().toISOString(),
  })

  if (error) {
    console.error('tasting_notes insert error:', error)
    return NextResponse.json({ error: 'Failed to save tasting note' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
