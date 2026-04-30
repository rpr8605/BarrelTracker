import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { generateStory } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { batch_id } = await req.json()
  const admin = createServiceClient()

  const { data: batch } = await admin.from('batches').select('*').eq('id', batch_id).single()
  if (!batch) return NextResponse.json({ error: 'Batch not found' }, { status: 404 })

  const { data: barrels } = batch.barrel_ids?.length
    ? await admin.from('barrels').select('*').in('id', batch.barrel_ids)
    : { data: [] }

  try {
    const story = await generateStory(batch, barrels || [])
    return NextResponse.json({ story })
  } catch {
    return NextResponse.json({ error: 'Story generation failed' }, { status: 500 })
  }
}
