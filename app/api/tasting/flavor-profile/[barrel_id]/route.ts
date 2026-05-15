import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'

export async function GET(_req: Request, { params }: { params: { barrel_id: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) return NextResponse.json({ error: 'no_distillery' }, { status: 400 })

  const db = createServiceClient()
  const { data: sessions } = await db
    .from('tasting_sessions')
    .select('id, sampled_at, tasting_notes(descriptors)')
    .eq('barrel_id', params.barrel_id)
    .eq('distillery_id', distilleryId)
    .order('sampled_at', { ascending: true })

  const freq: Record<string, number> = {}
  for (const s of (sessions || []) as Array<{ tasting_notes: Array<{ descriptors: string[] }> }>) {
    for (const n of s.tasting_notes || []) {
      for (const d of n.descriptors || []) {
        const k = d.toLowerCase()
        freq[k] = (freq[k] || 0) + 1
      }
    }
  }
  const top = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 8)
  return NextResponse.json({ top_descriptors: top, total_sessions: sessions?.length || 0 })
}
