import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { extractTagsFromText } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { transcript, barrel_data, barrel_id } = await req.json()
  const admin = createServiceClient()

  const { data: tagEntries } = await admin
    .from('tag_library')
    .select('tag')
    .order('usage_count', { ascending: false })
    .limit(150)

  const tagList = (tagEntries || []).map((t: { tag: string }) => t.tag)
  const text = transcript || JSON.stringify(barrel_data || {})

  let result = { tags: [] as string[], flavors: [] as { name: string; intensity: number; confidence: number }[] }
  try {
    result = await extractTagsFromText(text, tagList)
  } catch {
    return NextResponse.json({ tags: [], flavors: [] })
  }

  if (barrel_id && result.tags.length) {
    const { data: barrel } = await admin.from('barrels').select('tags').eq('id', barrel_id).single()
    const merged = Array.from(new Set([...(barrel?.tags || []), ...result.tags]))
    await admin.from('barrels').update({ tags: merged }).eq('id', barrel_id)
  }

  return NextResponse.json(result)
}
