import { createClient } from './supabase'
import { updateTasteProfile } from './anthropic'
import type { TasteProfile } from '@/types/database'

export async function recalculateProfile(userId: string): Promise<void> {
  const supabase = createClient()

  const [profileRes, notesRes] = await Promise.all([
    supabase.from('taste_profile').select('*').eq('user_id', userId).single(),
    supabase
      .from('voice_notes')
      .select('ai_extracted_tags, ai_extracted_flavors')
      .order('recorded_at', { ascending: false })
      .limit(50),
  ])

  const profile = profileRes.data as TasteProfile | null
  const notes = notesRes.data || []

  const signals = notes.map((note) => ({
    type: 'voice_note' as const,
    flavors: note.ai_extracted_tags || [],
    grains: [],
  }))

  const updatedProfile = await updateTasteProfile(
    profile ? { grain_scores: profile.grain_scores, flavor_scores: profile.flavor_scores } : {},
    signals
  )

  if (profile) {
    await supabase
      .from('taste_profile')
      .update({ ...updatedProfile, last_updated: new Date().toISOString() })
      .eq('user_id', userId)
  } else {
    await supabase.from('taste_profile').insert({
      user_id: userId,
      ...updatedProfile,
      last_updated: new Date().toISOString(),
    })
  }
}

export function buildInventorySummary(barrels: Record<string, unknown>[]): string {
  const total = barrels.length
  const ready = barrels.filter((b) => b.status === 'ready').length
  const aging = barrels.filter((b) => b.status === 'aging').length
  const allTags = barrels.flatMap((b) => (b.tags as string[]) || [])
  const topTags = Array.from(new Set(allTags)).slice(0, 20).join(', ')

  return `${total} barrels total. ${ready} ready to bottle, ${aging} aging. Top flavor tags across inventory: ${topTags}`
}
