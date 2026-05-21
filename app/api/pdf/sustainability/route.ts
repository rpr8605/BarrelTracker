import { NextResponse } from 'next/server'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'
import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { sumLogs } from '@/lib/sustainability'
import { uploadToR2 } from '@/lib/r2'
import { callAi } from '@/lib/ai-router'

async function narrative(name: string, year: number, summary: ReturnType<typeof sumLogs>, prevSummary: ReturnType<typeof sumLogs> | null) {
  try {
    return await callAi({
      task: 'CREATIVE',
      maxTokens: 250,
      system: 'Write a short 3-sentence sustainability narrative for a craft distillery annual report. Plain language, factual, no emojis. End on tone of forward-looking improvement.',
      prompt: `Distillery: ${name}\nYear: ${year}\nWater: ${summary.water_gallons.toFixed(0)} gal\nEnergy: ${summary.energy_kwh.toFixed(0)} kWh\nCO2e: ${summary.co2e_metric_tons.toFixed(2)} metric tons\nLocal grain: ${summary.pct_local.toFixed(0)}%${prevSummary ? `\nPrior year CO2e: ${prevSummary.co2e_metric_tons.toFixed(2)} metric tons` : ''}`,
    })
  } catch {
    return ''
  }
}

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) return NextResponse.json({ error: 'no_distillery' }, { status: 400 })

  const body = await req.json().catch(() => ({})) as { year?: number }
  const year = body.year || new Date().getFullYear()

  const db = createServiceClient()
  const { data: dist } = await db.from('distilleries').select('name').eq('id', distilleryId).single()
  const { data: cur } = await db.from('production_sustainability_log').select('*').eq('distillery_id', distilleryId).gte('log_date', `${year}-01-01`).lt('log_date', `${year + 1}-01-01`)
  const { data: prev } = await db.from('production_sustainability_log').select('*').eq('distillery_id', distilleryId).gte('log_date', `${year - 1}-01-01`).lt('log_date', `${year}-01-01`)

  const curSummary = sumLogs((cur || []) as never)
  const prevSummary = (prev && prev.length) ? sumLogs(prev as never) : null
  const story = await narrative(dist?.name || 'Distillery', year, curSummary, prevSummary)

  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const page = doc.addPage([612, 792])
  let y = 750
  const L = 50
  const text = (t: string, x: number, yy: number, size = 10, b = false, color = rgb(0, 0, 0)) =>
    page.drawText(t, { x, y: yy, size, font: b ? bold : font, color })

  text(`${dist?.name || 'Distillery'} — Sustainability Report ${year}`, L, y, 14, true); y -= 22

  const metric = (label: string, value: string) => {
    text(label, L, y, 9, false, rgb(0.4, 0.4, 0.4))
    text(value, L + 200, y, 11, true)
    y -= 16
  }
  metric('Water used (gal)', curSummary.water_gallons.toFixed(0))
  metric('Energy (kWh)', curSummary.energy_kwh.toFixed(0))
  metric('Waste (kg)', curSummary.waste_kg.toFixed(0))
  metric('Estimated CO2e (metric tons)', curSummary.co2e_metric_tons.toFixed(2))
  metric('Local grain share', `${curSummary.pct_local.toFixed(0)}%`)
  y -= 8

  if (prevSummary) {
    const diff = curSummary.co2e_metric_tons - prevSummary.co2e_metric_tons
    text(`YoY CO2e change: ${diff >= 0 ? '+' : ''}${diff.toFixed(2)} mt vs ${year - 1}`, L, y, 10, true, diff > 0 ? rgb(0.7, 0.2, 0.1) : rgb(0.1, 0.5, 0.2))
    y -= 18
  }

  text('Grain sourcing', L, y, 11, true); y -= 14
  text(`Local: ${curSummary.grain.local.toFixed(0)} lbs · Regional: ${curSummary.grain.regional.toFixed(0)} lbs · Commodity: ${curSummary.grain.commodity.toFixed(0)} lbs`, L, y, 9); y -= 18

  text('Methodology', L, y, 11, true); y -= 14
  const lines = [
    'CO2e factors from EPA grid averages (electricity), municipal water treatment estimates, and',
    'landfill waste impact. Grain transport scaled by miles tier. Estimates only.',
  ]
  for (const l of lines) { text(l, L, y, 9, false, rgb(0.4, 0.4, 0.4)); y -= 12 }
  y -= 6

  if (story) {
    text('Narrative', L, y, 11, true); y -= 14
    const wrapped = wrap(story, 90)
    for (const l of wrapped) { text(l, L, y, 9); y -= 12 }
  }

  const pdfBytes = await doc.save()
  const key = `sustainability/${distilleryId}/${year}-${Date.now()}.pdf`
  const url = await uploadToR2(key, Buffer.from(pdfBytes), 'application/pdf')

  return NextResponse.json({ pdf_url: url, summary: curSummary })
}

function wrap(text: string, width: number): string[] {
  const words = text.split(/\s+/)
  const out: string[] = []
  let line = ''
  for (const w of words) {
    if ((line + ' ' + w).trim().length > width) { out.push(line.trim()); line = w } else line += ' ' + w
  }
  if (line.trim()) out.push(line.trim())
  return out
}
