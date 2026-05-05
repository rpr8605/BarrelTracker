import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'

const CATEGORIES = [
  'BEST_BOURBON', 'BEST_RYE', 'BEST_SINGLE_MALT', 'BEST_WHEAT', 'BEST_EXPERIMENTAL',
  'MOST_FOLLOWERS', 'TOP_DISTILLERY', 'BEST_STORY', 'BEST_COLLABORATION',
  'COMMUNITY_FAVORITE', 'COLLECTOR_OF_THE_YEAR',
]

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const db = createServiceClient()
  const { data: profile } = await db.from('user_profiles').select('is_super_admin').eq('id', user.id).single()
  if (!profile?.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { year } = await req.json()
  if (!year) return NextResponse.json({ error: 'Missing year' }, { status: 400 })

  const inserts = CATEGORIES.map((category) => ({ year, category }))
  const { error } = await db.from('awards').insert(inserts)
  if (error && !error.message.includes('duplicate')) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ message: `${CATEGORIES.length} award categories created for ${year}` })
}
