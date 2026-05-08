import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { generateComplianceDeadlines } from '@/lib/ttb/compliance-calendar'

function icsDate(isoDate: string): string {
  return isoDate.replace(/-/g, '')
}

function icsEscape(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n')
}

function nextDay(isoDate: string): string {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0].replace(/-/g, '')
}

export async function GET(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const distilleryId = searchParams.get('distillery_id')
  if (!distilleryId) return new NextResponse('Missing distillery_id', { status: 400 })

  const admin = createServiceClient()
  const { data: permits } = await admin
    .from('dsp_documents')
    .select('id,title,expiration_date')
    .eq('distillery_id', distilleryId)
    .eq('status', 'active')
    .not('expiration_date', 'is', null)

  const deadlines = generateComplianceDeadlines(
    new Date(),
    12,
    (permits ?? []).map((p) => ({ id: p.id as string, title: p.title as string, expiration_date: p.expiration_date as string }))
  )

  const events = deadlines.map((d) => [
    'BEGIN:VEVENT',
    `UID:${d.id}@still-ttb`,
    `DTSTART;VALUE=DATE:${icsDate(d.due_date)}`,
    `DTEND;VALUE=DATE:${nextDay(d.due_date)}`,
    `SUMMARY:${icsEscape(d.title)}`,
    `DESCRIPTION:${icsEscape(d.description)}${d.form ? icsEscape(' Form: ' + d.form) : ''}`,
    `CATEGORIES:${d.category.toUpperCase()}`,
    'STATUS:NEEDS-ACTION',
    'END:VEVENT',
  ].join('\r\n'))

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Still TTB//Compliance Calendar//EN',
    'CALSCALE:GREGORIAN',
    'X-WR-CALNAME:TTB Compliance Deadlines',
    'X-WR-TIMEZONE:America/New_York',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n')

  return new NextResponse(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="ttb-compliance.ics"',
    },
  })
}
