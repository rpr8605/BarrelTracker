import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { uploadToR2, generateVoiceNoteKey } from '@/lib/r2'
import { extractTagsFromText } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const audio = formData.get('audio') as File | null
  const barrelId = formData.get('barrelId') as string
  const distilleryId = formData.get('distilleryId') as string
  const duration = parseInt(formData.get('duration') as string || '0')

  if (!audio || !barrelId) return NextResponse.json({ error: 'Missing audio or barrelId' }, { status: 400 })

  const noteId = crypto.randomUUID()
  const key = generateVoiceNoteKey(barrelId, noteId)

  let audioUrl: string | null = null
  try {
    const buffer = Buffer.from(await audio.arrayBuffer())
    audioUrl = await uploadToR2(key, buffer, 'audio/webm')
  } catch {
    // R2 not configured — proceed without audio storage
  }

  // Basic transcript placeholder — production would use a speech-to-text service
  const transcript = 'Voice note recorded. AI analysis pending.'

  // Get tag library for extraction
  const { data: tags } = await supabase.from('tag_library').select('tag').order('usage_count', { ascending: false }).limit(100)
  const tagList = (tags || []).map((t: { tag: string }) => t.tag)

  let extracted = { tags: [] as string[], flavors: [] as { name: string; intensity: number; confidence: number }[] }
  if (tagList.length) {
    try {
      extracted = await extractTagsFromText(transcript, tagList)
    } catch { /* AI not configured */ }
  }

  const { data: note, error } = await supabase.from('voice_notes').insert({
    id: noteId,
    barrel_id: barrelId,
    distillery_id: distilleryId,
    audio_url: audioUrl,
    transcript,
    ai_extracted_tags: extracted.tags,
    ai_extracted_flavors: extracted.flavors,
    duration_seconds: duration,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Update barrel tags
  if (extracted.tags.length) {
    const { data: barrel } = await supabase.from('barrels').select('tags').eq('id', barrelId).single()
    const existingTags = barrel?.tags || []
    const mergedTags = Array.from(new Set([...existingTags, ...extracted.tags]))
    await supabase.from('barrels').update({ tags: mergedTags }).eq('id', barrelId)
  }

  return NextResponse.json(note)
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { searchParams } = new URL(req.url)
  const barrelId = searchParams.get('barrel_id')

  let q = supabase.from('voice_notes').select('*')
  if (barrelId) q = q.eq('barrel_id', barrelId)
  q = q.order('recorded_at', { ascending: false })

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
