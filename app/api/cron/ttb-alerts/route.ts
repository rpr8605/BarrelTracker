import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { callAi } from '@/lib/ai-router'
import { sendEmail } from '@/lib/email'
import { notifyDistillerySubscribers } from '@/lib/push'
import { RegulatoryAlertEmail } from '@/emails/RegulatoryAlertEmail'

interface FederalRegisterArticle {
  document_number: string
  title: string
  abstract?: string
  html_url: string
  publication_date: string
}

interface ClassifierOutput {
  relevant: boolean
  summary: string
  action_required: string | null
  effective_date: string | null
  affects_types: string[]
}

async function classify(article: FederalRegisterArticle): Promise<ClassifierOutput> {
  try {
    const content = await callAi({
      task: 'COMPLIANCE',
      maxTokens: 600,
      system: 'You are a TTB compliance expert for US craft distilleries with DSP permits. Analyze the Federal Register article and determine: (1) Is it relevant to a craft DSP (Distilled Spirits Plant) operator? (2) If yes, provide a plain-language summary (2-3 sentences), any specific action required, the effective date if mentioned, and which permit types are affected. Return JSON only with shape: { "relevant": bool, "summary": string, "action_required": string|null, "effective_date": string|null, "affects_types": string[] }. Use permit types like "DSP", "Winery", "Brewery".',
      prompt: `Title: ${article.title}\n\nAbstract: ${article.abstract || '(none)'}\n\nPublished: ${article.publication_date}`,
    })

    const cleaned = content.replace(/```json\n?|\n?```/g, '').trim()
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('Error in TTB alert classification:', error)
    return { relevant: false, summary: '', action_required: null, effective_date: null, affects_types: [] }
  }
}

export async function GET(req: Request) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  let processed = 0, inserted = 0

  const url = 'https://www.federalregister.gov/api/v1/articles.json?conditions[agencies][]=alcohol-and-tobacco-tax-and-trade-bureau&order=newest&per_page=20'
  let articles: FederalRegisterArticle[] = []
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } })
    const j = await r.json() as { results: FederalRegisterArticle[] }
    articles = j.results || []
  } catch (e: unknown) {
    return NextResponse.json({ error: 'fetch_failed', message: e instanceof Error ? e.message : 'unknown' }, { status: 502 })
  }

  for (const article of articles) {
    processed++
    const { data: existing } = await db.from('regulatory_alerts').select('id').eq('source_url', article.html_url).maybeSingle()
    if (existing) continue
    const c = await classify(article)
    if (!c.relevant) continue
    const { data: alert, error } = await db.from('regulatory_alerts').insert({
      source_url: article.html_url,
      title: article.title,
      summary: c.summary,
      action_required: c.action_required,
      effective_date: c.effective_date,
      affects_types: c.affects_types,
      raw_content: article.abstract || null,
      published_at: article.publication_date,
    }).select().single()
    if (error || !alert) continue
    inserted++

    // Fan out to subscribers
    const { data: prefs } = await db.from('alert_preferences').select('*, distilleries!inner(id, name, owner_id)')
    for (const pref of (prefs || []) as Array<{ distillery_id: string; email_enabled: boolean; push_enabled: boolean; permit_types: string[]; distilleries: { name: string; owner_id: string } }>) {
      const matches = alert.affects_types.length === 0 || alert.affects_types.some((t: string) => pref.permit_types.includes(t))
      if (!matches) continue
      const { error: deliverErr } = await db.from('alert_deliveries').insert({
        distillery_id: pref.distillery_id,
        alert_id: alert.id,
      })
      if (deliverErr) continue

      if (pref.email_enabled) {
        const { data: ownerProfile } = await (db.from('auth.users' as never).select('email').eq('id', pref.distilleries.owner_id).maybeSingle() as unknown as Promise<{ data: { email: string } | null }>).catch(() => ({ data: null as { email: string } | null }))
        const ownerEmail = (ownerProfile as { email?: string } | null)?.email
        if (ownerEmail) {
          await sendEmail({
            to: ownerEmail,
            subject: '⚠️ TTB Regulatory Update — Action May Be Required',
            react: RegulatoryAlertEmail({
              distillery_name: pref.distilleries.name,
              title: alert.title,
              summary: alert.summary,
              action_required: alert.action_required,
              effective_date: alert.effective_date,
              source_url: alert.source_url,
            }),
          }).catch(() => {})
        }
      }
      if (pref.push_enabled) {
        await notifyDistillerySubscribers(pref.distillery_id, 'milestone', {
          title: 'TTB regulatory update',
          body: alert.title,
          url: alert.source_url,
          tag: `ttb-${alert.id}`,
        }).catch(() => {})
      }
    }
  }

  return NextResponse.json({ ok: true, processed, inserted })
}
