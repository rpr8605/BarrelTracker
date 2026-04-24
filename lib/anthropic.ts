import Anthropic from '@anthropic-ai/sdk'

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export const HAIKU = 'claude-haiku-4-5-20251001'
export const SONNET = 'claude-sonnet-4-6'

const TAG_LIBRARY_CACHE_KEY = 'tag-library-v1'

export async function extractTagsFromText(
  text: string,
  tagLibrary: string[]
): Promise<{ tags: string[]; flavors: { name: string; intensity: number; confidence: number }[] }> {
  const tagList = tagLibrary.join(', ')

  const response = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 500,
    system: [
      {
        type: 'text',
        text: `You are a whiskey barrel tag extractor. Given text about a barrel, extract matching tags from this library:\n\n${tagList}\n\nReturn JSON only: {"tags": ["tag1","tag2"], "flavors": [{"name":"Honey","intensity":8,"confidence":0.9}]}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: `Extract tags from: ${text}` }],
  })

  try {
    const content = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return { tags: [], flavors: [] }
  }
}

export async function generateBlendRecommendations(
  tasteProfile: Record<string, unknown>,
  barrels: Record<string, unknown>[]
) {
  const profileStr = JSON.stringify(tasteProfile)
  const barrelsStr = JSON.stringify(barrels)

  const response = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 2000,
    system: [
      {
        type: 'text',
        text: `You are a master blender AI for a craft distillery. You know this distiller's taste profile intimately:\n\n${profileStr}\n\nGenerate blend recommendations that match their palate. Return JSON array of 3 blends: [{"name":"...","barrel_ids":[],"blend_ratios":{},"projected_flavor_profile":"...","yield_gallons":0,"bottle_count":0,"cost_per_bottle":0,"profile_match":85}]`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Available barrels for blending:\n${barrelsStr}`,
      },
    ],
  })

  try {
    const content = response.content[0].type === 'text' ? response.content[0].text : '[]'
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return []
  }
}

export async function updateTasteProfile(
  currentProfile: Record<string, unknown>,
  newSignals: { type: 'voice_note' | 'barrel_ready' | 'batch_approved' | 'barrel_skipped'; flavors: string[]; grains: string[] }[]
) {
  const response = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 800,
    system: [
      {
        type: 'text',
        text: 'You are a taste profile engine. Update the distiller\'s profile based on new flavor signals. Weights: voice_note=1.0, barrel_ready=2.0, batch_approved=3.0, barrel_skipped=-1.0. Return updated profile JSON: {"grain_scores":{},"flavor_scores":{},"aging_sweet_spot_months":{"min":0,"max":0}}',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Current profile: ${JSON.stringify(currentProfile)}\n\nNew signals: ${JSON.stringify(newSignals)}`,
      },
    ],
  })

  try {
    const content = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return currentProfile
  }
}

export async function generateStory(batch: Record<string, unknown>, barrels: Record<string, unknown>[]) {
  const response = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 1500,
    temperature: 0.8 as never,
    system: [
      {
        type: 'text',
        text: 'You are a whiskey storyteller. Write compelling, approachable narratives about whiskey batches for bottle labels and story pages. No technical jargon. Write in second person, drawing readers into the journey of each barrel. Keep it vivid, warm, and under 400 words total across 3-4 paragraphs.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Write the story for this batch:\n\nBatch: ${JSON.stringify(batch)}\n\nBarrels: ${JSON.stringify(barrels)}`,
      },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export async function generateComplianceReport(distilleryId: string, reportData: Record<string, unknown>) {
  const response = await anthropic.messages.create({
    model: SONNET,
    max_tokens: 3000,
    system: [
      {
        type: 'text',
        text: 'You are a TTB compliance specialist. Generate accurate monthly Distilled Spirits Plant (DSP) reports based on production data. Format output as structured JSON matching TTB reporting requirements. Include: production summary, barrel movements, bulk spirits summary, bottling records.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Generate TTB report for distillery ${distilleryId}:\n\n${JSON.stringify(reportData)}`,
      },
    ],
  })

  try {
    const content = response.content[0].type === 'text' ? response.content[0].text : '{}'
    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch {
    return {}
  }
}

export async function chatResponse(
  messages: { role: 'user' | 'assistant'; content: string }[],
  inventorySummary: string,
  tasteProfile: Record<string, unknown>
) {
  const isBlendingQuestion = messages[messages.length - 1]?.content
    .toLowerCase()
    .match(/blend|mix|combine|batch|recommend/)

  const model = isBlendingQuestion ? SONNET : HAIKU

  const response = await anthropic.messages.create({
    model,
    max_tokens: 600,
    system: [
      {
        type: 'text',
        text: `You are Still's assistant for William's distillery. You know his full barrel inventory and taste profile intimately. Answer in plain, friendly language — never use technical jargon. Suggest specific actions when relevant. Keep responses concise and actionable.\n\nInventory summary:\n${inventorySummary}\n\nTaste profile:\n${JSON.stringify(tasteProfile)}`,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages,
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export async function getSearchInsight(query: string, inventorySummary: string) {
  const response = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 150,
    system: [
      {
        type: 'text',
        text: 'You are a whiskey inventory assistant. Given a search query, provide exactly one insightful sentence about what this means in context of the inventory. Plain language, no jargon.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Search: "${query}"\nInventory: ${inventorySummary}`,
      },
    ],
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

export async function scoreBarrelMatch(
  barrel: Record<string, unknown>,
  tasteProfile: Record<string, unknown>
): Promise<number> {
  const response = await anthropic.messages.create({
    model: HAIKU,
    max_tokens: 50,
    system: [
      {
        type: 'text',
        text: 'Score how well a barrel matches a distiller\'s taste profile. Return only a number 0-100.',
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: `Barrel: ${JSON.stringify(barrel)}\nProfile: ${JSON.stringify(tasteProfile)}`,
      },
    ],
  })

  const text = response.content[0].type === 'text' ? response.content[0].text : '50'
  return parseInt(text.replace(/\D/g, '')) || 50
}
