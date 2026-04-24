import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { chatResponse } from '@/lib/anthropic'
import { buildInventorySummary } from '@/lib/taste-profile'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { messages } = await req.json()

  const [barrelRes, profileRes, distRes] = await Promise.all([
    supabase.from('barrels').select('id,barrel_number,mash_bill,status,tags,profile_match_score,entry_date').limit(50),
    supabase.from('taste_profile').select('*').eq('user_id', user.id).single(),
    supabase.from('distilleries').select('name').eq('owner_id', user.id).limit(1).single(),
  ])

  const barrels = (barrelRes.data || []) as Record<string, unknown>[]
  const profile = profileRes.data || {}
  const summary = buildInventorySummary(barrels)

  try {
    const response = await chatResponse(messages, summary, profile)
    return NextResponse.json({ response })
  } catch {
    return NextResponse.json({ response: 'Having trouble connecting right now. Try again in a moment.' })
  }
}
