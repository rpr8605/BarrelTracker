import { createClient } from './supabase'
import type { TagLibraryEntry } from '@/types/database'

let cachedTags: TagLibraryEntry[] | null = null
let cacheExpiry = 0

export async function getTagLibrary(): Promise<TagLibraryEntry[]> {
  if (cachedTags && Date.now() < cacheExpiry) return cachedTags

  const supabase = createClient()
  const { data } = await supabase
    .from('tag_library')
    .select('*')
    .order('usage_count', { ascending: false })

  cachedTags = data || []
  cacheExpiry = Date.now() + 10 * 60 * 1000
  return cachedTags
}

export async function getTagsByCategory(category: string): Promise<string[]> {
  const tags = await getTagLibrary()
  return tags.filter((t) => t.category === category).map((t) => t.tag)
}

export async function incrementTagUsage(tags: string[]): Promise<void> {
  const supabase = createClient()
  for (const tag of tags) {
    try { await supabase.rpc('increment_tag_usage', { tag_name: tag }) } catch { /* ignore */ }
  }
}

export function getBarrelAgeMonths(entryDate: string | null): number {
  if (!entryDate) return 0
  const entry = new Date(entryDate)
  const now = new Date()
  return Math.floor((now.getTime() - entry.getTime()) / (1000 * 60 * 60 * 24 * 30.44))
}

export function getAgeColor(months: number): string {
  if (months <= 12) return '#EAF3DE'
  if (months <= 24) return '#FAEEDA'
  if (months <= 36) return '#FAC775'
  if (months <= 48) return '#EF9F27'
  return '#D85A30'
}

export function estimateAngelsShare(months: number, tier: number | null): number {
  const baseRate = 0.04
  const tierBonus = tier ? (tier - 1) * 0.005 : 0
  return Math.min(((baseRate + tierBonus) * months) / 12, 25)
}
