import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'

function csvEscape(v: string | number | null | undefined) {
  if (v == null) return ''
  const s = String(v)
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`
  return s
}

export async function GET(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return new Response('unauthorized', { status: 401 })

  const { searchParams } = new URL(req.url)
  const weekStart = searchParams.get('week_start')
  const weekEnd = searchParams.get('week_end')
  const distilleryId = getActiveDistilleryId()
  if (!weekStart || !weekEnd || !distilleryId) return new Response('missing_params', { status: 400 })

  const db = createServiceClient()
  const { data: dist } = await db.from('distilleries').select('name').eq('id', distilleryId).single()
  const { data: entries } = await db.from('time_entries')
    .select('id, clock_in, clock_out, nfc_verified, approved_at, staff_members(name, hourly_rate, role)')
    .eq('distillery_id', distilleryId)
    .gte('clock_in', weekStart)
    .lte('clock_in', weekEnd)
    .order('clock_in', { ascending: true })

  const rows: string[] = ['Staff,Role,Clock In,Clock Out,Hours,Hourly Rate,Pay,NFC Verified,Approved']
  let totalHours = 0
  let totalPay = 0
  for (const e of (entries || []) as unknown as Array<{ clock_in: string; clock_out: string | null; nfc_verified: boolean; approved_at: string | null; staff_members: { name: string; hourly_rate: number | null; role: string | null } | null }>) {
    const inT = new Date(e.clock_in)
    const outT = e.clock_out ? new Date(e.clock_out) : null
    const hours = outT ? (outT.getTime() - inT.getTime()) / 3600000 : 0
    const rate = e.staff_members?.hourly_rate ?? 0
    const pay = hours * rate
    totalHours += hours
    totalPay += pay
    rows.push([
      csvEscape(e.staff_members?.name),
      csvEscape(e.staff_members?.role),
      csvEscape(inT.toISOString()),
      csvEscape(outT ? outT.toISOString() : ''),
      csvEscape(hours.toFixed(2)),
      csvEscape(rate ? rate.toFixed(2) : ''),
      csvEscape(rate ? pay.toFixed(2) : ''),
      csvEscape(e.nfc_verified ? 'Y' : 'N'),
      csvEscape(e.approved_at ? 'Y' : 'N'),
    ].join(','))
  }
  rows.push('')
  rows.push(`TOTAL,,,,${totalHours.toFixed(2)},,${totalPay.toFixed(2)},,`)

  const name = (dist?.name || 'distillery').replace(/[^a-z0-9]+/gi, '_')
  const fname = `timesheets_${weekStart}_${name}.csv`
  return new Response(rows.join('\n'), {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${fname}"`,
    },
  })
}
