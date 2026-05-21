import Anthropic from '@anthropic-ai/sdk'

export type TaskType = 'EXTRACTION' | 'COMPLIANCE' | 'REASONING' | 'CREATIVE' | 'DEFAULT'

export interface CallAiParams {
  task: TaskType
  system?: string
  prompt?: string
  messages?: { role: 'user' | 'assistant' | 'system'; content: string }[]
  temperature?: number
  maxTokens?: number
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
})

export const HAIKU = process.env.AI_CHEAP_MODEL || 'claude-3-haiku-20240307'

function getModelForTask(task: TaskType): string {
  switch (task) {
    case 'EXTRACTION':
      return HAIKU
    case 'COMPLIANCE':
      return process.env.AI_COMPLIANCE_MODEL || 'claude-3-5-sonnet-20240620'
    case 'REASONING':
      return process.env.AI_REASONING_MODEL || 'claude-3-5-sonnet-20240620'
    case 'CREATIVE':
      return process.env.AI_CREATIVE_MODEL || 'claude-3-5-sonnet-20240620'
    case 'DEFAULT':
    default:
      return process.env.AI_DEFAULT_MODEL || 'claude-3-haiku-20240307'
  }
}

export async function callAi({
  task,
  system,
  prompt,
  messages = [],
  temperature = 0.7,
  maxTokens = 1000,
}: CallAiParams): Promise<string> {
  const provider = (process.env.AI_PROVIDER || 'anthropic').toLowerCase()
  let model = getModelForTask(task)
  const logPrompts = process.env.AI_LOG_PROMPTS === 'true'
  const maxCost = parseFloat(process.env.AI_MAX_COST_PER_REQUEST_USD || '0')

  // Simple cost safety check placeholder
  // In a real scenario, this would check against a pricing table
  if (maxCost > 0 && maxCost < 0.01) { 
    console.warn(`[AI-ROUTER] Warning: AI_MAX_COST_PER_REQUEST_USD is set very low ($${maxCost}). Large requests might be blocked if cost estimation is implemented.`)
  }

  if (logPrompts) {
    console.log(`[AI-ROUTER] Task: ${task}, Provider: ${provider}, Model: ${model}`)
  }

  // Support zdr (Zero Data Retention) for OpenRouter if requested via env
  if (provider === 'openrouter' && process.env.AI_USE_ZDR === 'true' && !model.includes(':zdr')) {
    model = `${model}:zdr`
  }

  // Combine system and prompt into messages if needed
  const fullMessages = [...messages]
  if (prompt) {
    fullMessages.push({ role: 'user', content: prompt })
  }

  try {
    switch (provider) {
      case 'anthropic':
        return await callAnthropic(model, system, fullMessages, temperature, maxTokens)
      case 'openrouter':
        return await callOpenRouter(model, system, fullMessages, temperature, maxTokens)
      case 'openai':
        return await callOpenAi(model, system, fullMessages, temperature, maxTokens)
      case 'google':
        return await callGoogle(model, system, fullMessages, temperature, maxTokens)
      default:
        throw new Error(`Unsupported AI provider: ${provider}`)
    }
  } catch (error) {
    console.error(`[AI-ROUTER] Error in callAi:`, error)
    throw error
  }
}

async function callAnthropic(
  model: string,
  system: string | undefined,
  messages: any[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system: system ? [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } } as any] : undefined,
    messages: messages.filter(m => m.role !== 'system'),
  })

  return response.content[0].type === 'text' ? response.content[0].text : ''
}

async function callOpenRouter(
  model: string,
  system: string | undefined,
  messages: any[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const url = 'https://openrouter.ai/api/v1/chat/completions'
  const apiKey = process.env.OPENROUTER_API_KEY

  const bodyMessages = system ? [{ role: 'system', content: system }, ...messages] : messages

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': process.env.SITE_URL || 'http://localhost:3000',
      'X-Title': 'Still Consulting',
    },
    body: JSON.stringify({
      model,
      messages: bodyMessages,
      temperature,
      max_tokens: maxTokens,
      provider: {
        data_collection: 'deny',
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenRouter API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

async function callOpenAi(
  model: string,
  system: string | undefined,
  messages: any[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  const url = 'https://api.openai.com/v1/chat/completions'
  const apiKey = process.env.OPENAI_API_KEY

  const bodyMessages = system ? [{ role: 'system', content: system }, ...messages] : messages

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: bodyMessages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.choices[0]?.message?.content || ''
}

async function callGoogle(
  model: string,
  system: string | undefined,
  messages: any[],
  temperature: number,
  maxTokens: number
): Promise<string> {
  // Using Gemini REST API
  const apiKey = process.env.GOOGLE_AI_API_KEY
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`

  const contents = messages.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }],
  }))

  const body: any = {
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: maxTokens,
    },
  }

  if (system) {
    body.system_instruction = {
      parts: [{ text: system }],
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Google AI API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.candidates[0]?.content?.parts[0]?.text || ''
}
