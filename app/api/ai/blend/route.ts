import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { generateBlendRecommendations } from '@/lib/anthropic'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { barrel_ids } = await req.json()

  const [barrelRes, profileRes] = await Promise.all([
    supabase.from('barrels').select('*').in('id', barrel_ids || []).limit(20),
    supabase.from('taste_profile').select('*').eq('user_id', user.id).single(),
  ])

  const barrels = barrelRes.data || []
  const profile = profileRes.data || {}

  try {
    const blends = await generateBlendRecommendations(profile, barrels)
    return NextResponse.json({ blends })
  } catch {
    return NextResponse.json({ blends: [] })
  }
}
