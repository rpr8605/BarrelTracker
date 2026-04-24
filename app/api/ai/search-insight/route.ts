import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getSearchInsight } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ insight: '' })

  const { query } = await req.json()
  if (!query) return NextResponse.json({ insight: '' })

  const { data: barrels } = await supabase.from('barrels').select('barrel_number,mash_bill,status,tags').limit(30)
  const allTags = (barrels || []).flatMap(b => (b as {tags?: string[]}).tags || [])
  const uniqueTags = Array.from(new Set(allTags)).slice(0, 10).join(', ')
  const summary = `${(barrels || []).length} barrels. Top types: ${uniqueTags}`

  try {
    const insight = await getSearchInsight(query, summary)
    return NextResponse.json({ insight })
  } catch {
    return NextResponse.json({ insight: '' })
  }
}
