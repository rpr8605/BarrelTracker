import { NextRequest, NextResponse } from 'next/server'
import { anthropic, HAIKU } from '@/lib/anthropic'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { barrelIds, distilleryName } = await req.json()
    if (!barrelIds?.length || barrelIds.length < 2) {
      return NextResponse.json({ error: 'Need at least 2 barrels' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const { data: barrels } = await supabase
      .from('barrels')
      .select('barrel_number, grain_type, mash_bill, entry_date, tags, status')
      .in('id', barrelIds)

    if (!barrels?.length) {
      return NextResponse.json({ error: 'Barrels not found' }, { status: 404 })
    }

    function ageMonths(entryDate: string | null): number | null {
      if (!entryDate) return null
      return Math.floor((Date.now() - new Date(entryDate).getTime()) / (1000 * 60 * 60 * 24 * 30.44))
    }

    const barrelDescriptions = barrels
      .map((b) => {
        const grain = Array.isArray(b.grain_type) ? b.grain_type.join(', ') : (b.mash_bill || 'Unknown grain')
        const age = ageMonths(b.entry_date)
        const ageStr = age !== null ? `${age} months` : 'unknown age'
        const flavorTags = b.tags?.slice(0, 6).join(', ') || 'no flavor notes yet'
        return `Barrel ${b.barrel_number}: ${grain}, aged ${ageStr}, flavor notes: ${flavorTags}`
      })
      .join('\n')

    const response = await anthropic.messages.create({
      model: HAIKU,
      max_tokens: 300,
      system: [
        {
          type: 'text',
          text: 'You are a master distiller guiding guests through a tasting experience. Write vivid, accessible descriptions — no jargon. Be warm, poetic, and brief.',
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `A guest has selected ${barrels.length} barrels for a tasting flight at ${distilleryName}. The barrels are:\n\n${barrelDescriptions}\n\nWrite a 2-3 sentence tasting flight description that connects the barrels thematically and suggests what to notice in each. Be poetic but accessible.`,
        },
      ],
    })

    const pairingNote = response.content[0].type === 'text' ? response.content[0].text : ''
    return NextResponse.json({ pairingNote })
  } catch (err) {
    console.error('Flight AI error:', err)
    return NextResponse.json({ error: 'Failed to generate pairing note' }, { status: 500 })
  }
}
