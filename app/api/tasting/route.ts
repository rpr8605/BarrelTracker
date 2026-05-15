import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { anthropic, HAIKU } from '@/lib/anthropic'

interface SensoryExtraction {
  nose: string[]
  palate: string[]
  finish: string[]
  overall_score: number | null
  color_description: string | null
  abv_estimate: number | null
}

async function extractFromTranscript(transcript: string): Promise<SensoryExtraction> {
  const response = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 600,
    system: [
      {
        type: 'text',
        text:
          'You are a master distiller analyzing tasting notes. Extract structured sensory data from the provided transcript. Return ONLY valid JSON in this exact shape: {"nose": ["descriptor1"], "palate": [...], "finish": [...], "overall_score": 0-100 or null, "color_description": "string or null", "abv_estimate": number or null}. Use industry-standard whiskey flavor descriptors (vanilla, caramel, oak, dried fruit, spice, floral, smoke, etc.). Return empty arrays / nulls if not present.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: transcript }],
  })
  try {
    const txt = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = txt.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { nose: [], palate: [], finish: [], overall_score: null, color_description: null, abv_estimate: null }
  }
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const body = await req.json() as {
    barrel_id: string
    voice_note_url?: string
    voice_note_transcript?: string
    abv_at_sample?: number
    color_description?: string
    overall_score?: number
    nose?: string[]
    palate?: string[]
    finish?: string[]
  }
  if (!body.barrel_id) return NextResponse.json({ error: 'missing barrel_id' }, { status: 400 })

  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) return NextResponse.json({ error: 'no_distillery' }, { status: 400 })

  let nose = body.nose || []
  let palate = body.palate || []
  let finish = body.finish || []
  let score = body.overall_score
  let color = body.color_description
  let abv = body.abv_at_sample

  if (body.voice_note_transcript) {
    const ai = await extractFromTranscript(body.voice_note_transcript)
    nose = nose.length ? nose : ai.nose
    palate = palate.length ? palate : ai.palate
    finish = finish.length ? finish : ai.finish
    score = score ?? ai.overall_score ?? undefined
    color = color ?? ai.color_description ?? undefined
    abv = abv ?? ai.abv_estimate ?? undefined
  }

  const db = createServiceClient()
  const { data: session, error } = await db.from('tasting_sessions').insert({
    distillery_id: distilleryId,
    barrel_id: body.barrel_id,
    sampled_by: user.id,
    abv_at_sample: abv ?? null,
    color_description: color ?? null,
    overall_score: score ?? null,
    voice_note_url: body.voice_note_url || null,
    voice_note_transcript: body.voice_note_transcript || null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const noteRows = [
    { tasting_session_id: session.id, category: 'nose',   descriptors: nose },
    { tasting_session_id: session.id, category: 'palate', descriptors: palate },
    { tasting_session_id: session.id, category: 'finish', descriptors: finish },
  ]
  await db.from('tasting_notes').insert(noteRows)

  return NextResponse.json({ session, notes: { nose, palate, finish } })
}
