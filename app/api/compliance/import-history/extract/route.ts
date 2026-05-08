import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import Anthropic from '@anthropic-ai/sdk'

const SYSTEM_PROMPT = `You are a TTB compliance data extractor. Extract structured data from TTB Form 5110.40, 5110.11, or 5110.28 and return ONLY valid JSON with this shape:
{
  "form_type": "5110.40" | "5110.11" | "5110.28",
  "report_month": "YYYY-MM-DD",
  "distillery_name": string | null,
  "dsp_number": string | null,
  "line_items": { [key: string]: number | string | null },
  "confirmation_number": string | null,
  "filed_date": "YYYY-MM-DD" | null
}
For report_month use the first day of the reporting period month. Extract all numeric line items with their line numbers as keys (e.g. "line_1", "line_2a"). Return null for any field you cannot determine.`

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  if (!file.type.includes('pdf') && !file.name.endsWith('.pdf')) {
    return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 })
  }

  const arrayBuffer = await file.arrayBuffer()
  const base64 = Buffer.from(arrayBuffer).toString('base64')

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2048,
    system: [{ type: 'text' as const, text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' as const } }],
    messages: [{
      role: 'user',
      content: [
        {
          type: 'document' as const,
          source: {
            type: 'base64' as const,
            media_type: 'application/pdf' as const,
            data: base64,
          },
        } as unknown as Anthropic.TextBlockParam,
        {
          type: 'text' as const,
          text: 'Extract the TTB compliance report data from this form. Return only the JSON object, no other text.',
        },
      ],
    }],
  })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''

  let extracted: Record<string, unknown>
  try {
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    extracted = JSON.parse(jsonMatch ? jsonMatch[0] : raw)
  } catch {
    return NextResponse.json({ error: 'Could not parse extracted data', raw }, { status: 422 })
  }

  return NextResponse.json({ extracted, filename: file.name })
}
