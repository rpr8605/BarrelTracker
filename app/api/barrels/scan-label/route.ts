import { anthropic, HAIKU } from '@/lib/ai-router'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { imageBase64, mimeType } = await req.json()
  if (!imageBase64) return Response.json({ error: 'No image' }, { status: 400 })

  const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
  const mediaType = validTypes.includes(mimeType) ? mimeType : 'image/jpeg'

  try {
    const msg = await anthropic.messages.create({
      model: HAIKU,
      max_tokens: 512,
      system: [
        {
          type: 'text',
          text: 'You are a barrel label reader for a whiskey distillery. Extract all visible text from barrel labels, stencils, or handwritten markings. Return ONLY a JSON object — no explanation.',
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
                data: imageBase64,
              },
            },
            {
              type: 'text',
              text: `Extract all visible text from this barrel label or barrel markings. Return a JSON object with these fields (use null for any not visible):
{
  "barrel_number": "the barrel ID or lot number",
  "mash_bill": "grain recipe e.g. 75% corn 21% rye 4% barley",
  "distillery_source": "the producing distillery name",
  "entry_date": "fill date in YYYY-MM-DD format",
  "entry_proof": 125.0,
  "notes": "any other text: tasting notes, distiller comments, label text"
}`,
            },
          ],
        },
      ],
    })

    const raw = msg.content[0].type === 'text' ? msg.content[0].text : ''
    const match = raw.match(/\{[\s\S]*\}/)
    if (!match) return Response.json({ extracted: null })

    const extracted = JSON.parse(match[0])
    return Response.json({ extracted })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Scan failed'
    return Response.json({ error: msg }, { status: 500 })
  }
}
