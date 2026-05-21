import { callAi } from './ai-router'

const TAG_LIBRARY_CACHE_KEY = 'tag-library-v1'

export async function extractTagsFromText(
  text: string,
  tagLibrary: string[]
): Promise<{ tags: string[]; flavors: { name: string; intensity: number; confidence: number }[] }> {
  const tagList = tagLibrary.join(', ')

  try {
    const content = await callAi({
      task: 'EXTRACTION',
      maxTokens: 500,
      system: `You are a whiskey barrel tag extractor. Given text about a barrel, extract matching tags from this library:\n\n${tagList}\n\nReturn JSON only: {"tags": ["tag1","tag2"], "flavors": [{"name":"Honey","intensity":8,"confidence":0.9}]}`,
      prompt: `Extract tags from: ${text}`,
    })

    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('[ANTHROPIC-WRAPPER] Error in extractTagsFromText:', error)
    return { tags: [], flavors: [] }
  }
}

export async function generateBlendRecommendations(
  tasteProfile: Record<string, unknown>,
  barrels: Record<string, unknown>[]
) {
  const profileStr = JSON.stringify(tasteProfile)
  const barrelsStr = JSON.stringify(barrels)

  try {
    const content = await callAi({
      task: 'REASONING',
      maxTokens: 2000,
      system: `You are a master blender AI for a craft distillery. You know this distiller's taste profile intimately:\n\n${profileStr}\n\nGenerate blend recommendations that match their palate. Return JSON array of 3 blends: [{"name":"...","barrel_ids":[],"blend_ratios":{},"projected_flavor_profile":"...","yield_gallons":0,"bottle_count":0,"cost_per_bottle":0,"profile_match":85}]`,
      prompt: `Available barrels for blending:\n${barrelsStr}`,
    })

    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('[ANTHROPIC-WRAPPER] Error in generateBlendRecommendations:', error)
    return []
  }
}

export async function updateTasteProfile(
  currentProfile: Record<string, unknown>,
  newSignals: { type: 'voice_note' | 'barrel_ready' | 'batch_approved' | 'barrel_skipped'; flavors: string[]; grains: string[] }[]
) {
  try {
    const content = await callAi({
      task: 'REASONING',
      maxTokens: 800,
      system: 'You are a taste profile engine. Update the distiller\'s profile based on new flavor signals. Weights: voice_note=1.0, barrel_ready=2.0, batch_approved=3.0, barrel_skipped=-1.0. Return updated profile JSON: {"grain_scores":{},"flavor_scores":{},"aging_sweet_spot_months":{"min":0,"max":0}}',
      prompt: `Current profile: ${JSON.stringify(currentProfile)}\n\nNew signals: ${JSON.stringify(newSignals)}`,
    })

    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('[ANTHROPIC-WRAPPER] Error in updateTasteProfile:', error)
    return currentProfile
  }
}

export async function generateStory(batch: Record<string, unknown>, barrels: Record<string, unknown>[]) {
  try {
    return await callAi({
      task: 'CREATIVE',
      maxTokens: 1500,
      temperature: 0.8,
      system: 'You are a whiskey storyteller. Write compelling, approachable narratives about whiskey batches for bottle labels and story pages. No technical jargon. Write in second person, drawing readers into the journey of each barrel. Keep it vivid, warm, and under 400 words total across 3-4 paragraphs.',
      prompt: `Write the story for this batch:\n\nBatch: ${JSON.stringify(batch)}\n\nBarrels: ${JSON.stringify(barrels)}`,
    })
  } catch (error) {
    console.error('[ANTHROPIC-WRAPPER] Error in generateStory:', error)
    return ''
  }
}

export async function generateComplianceReport(distilleryId: string, reportData: Record<string, unknown>) {
  try {
    const content = await callAi({
      task: 'COMPLIANCE',
      maxTokens: 3000,
      system: 'You are a TTB compliance specialist. Generate accurate monthly Distilled Spirits Plant (DSP) reports based on production data. Format output as structured JSON matching TTB reporting requirements. Include: production summary, barrel movements, bulk spirits summary, bottling records.',
      prompt: `Generate TTB report for distillery ${distilleryId}:\n\n${JSON.stringify(reportData)}`,
    })

    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('[ANTHROPIC-WRAPPER] Error in generateComplianceReport:', error)
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

  try {
    return await callAi({
      task: isBlendingQuestion ? 'REASONING' : 'DEFAULT',
      maxTokens: 600,
      system: `You are Still's assistant for William's distillery. You know his full barrel inventory and taste profile intimately. Answer in plain, friendly language — never use technical jargon. Suggest specific actions when relevant. Keep responses concise and actionable.\n\nInventory summary:\n${inventorySummary}\n\nTaste profile:\n${JSON.stringify(tasteProfile)}`,
      messages: messages as any,
    })
  } catch (error) {
    console.error('[ANTHROPIC-WRAPPER] Error in chatResponse:', error)
    return 'I am sorry, I am having trouble connecting to my brain right now.'
  }
}

export async function getSearchInsight(query: string, inventorySummary: string) {
  try {
    return await callAi({
      task: 'REASONING',
      maxTokens: 150,
      system: 'You are a whiskey inventory assistant. Given a search query, provide exactly one insightful sentence about what this means in context of the inventory. Plain language, no jargon.',
      prompt: `Search: "${query}"\nInventory: ${inventorySummary}`,
    })
  } catch (error) {
    console.error('[ANTHROPIC-WRAPPER] Error in getSearchInsight:', error)
    return ''
  }
}

export async function scoreBarrelMatch(
  barrel: Record<string, unknown>,
  tasteProfile: Record<string, unknown>
): Promise<number> {
  try {
    const content = await callAi({
      task: 'REASONING',
      maxTokens: 50,
      system: 'Score how well a barrel matches a distiller\'s taste profile. Return only a number 0-100.',
      prompt: `Barrel: ${JSON.stringify(barrel)}\nProfile: ${JSON.stringify(tasteProfile)}`,
    })

    return parseInt(content.replace(/\D/g, '')) || 50
  } catch (error) {
    console.error('[ANTHROPIC-WRAPPER] Error in scoreBarrelMatch:', error)
    return 50
  }
}
