export interface ApiResponse<T> {
  data: T | null
  error: string | null
}

export interface BarrelFilters {
  status?: string
  grain?: string
  source?: string
  finish?: string
  distillery_id?: string
  search?: string
}

export interface BlendRecommendation {
  name: string
  barrel_ids: string[]
  blend_ratios: Record<string, number>
  projected_flavor_profile: string
  yield_gallons: number
  bottle_count: number
  cost_per_bottle: number
  profile_match: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ExtractTagsRequest {
  transcript?: string
  barrel_data?: Record<string, unknown>
}

export interface ExtractTagsResponse {
  tags: string[]
  flavors: { name: string; intensity: number; confidence: number }[]
}
