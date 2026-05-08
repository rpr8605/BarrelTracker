import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

// Vercel cron: runs on the 7th of every month at 14:00 UTC
// Alerts distilleries with zero production/processing activity in the prior month
// who have not yet filed their reports

export async function GET(req: NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()
  const now = new Date()

  // Prior month range
  const priorMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const priorMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
  const priorStartISO = priorMonthStart.toISOString().split('T')[0]
  const priorEndISO = priorMonthEnd.toISOString().split('T')[0]
  const periodKey = priorStartISO // first of month

  const { data: distilleries } = await admin.from('distilleries').select('id, name, owner_id')
  if (!distilleries?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  let skipped = 0

  for (const dist of distilleries) {
    // Check if all forms are already submitted for this period
    const { data: period } = await admin.from('ttb_report_periods')
      .select('form_5110_40_status, form_5110_11_status, form_5110_28_status')
      .eq('distillery_id', dist.id)
      .eq('report_month', periodKey)
      .single()

    if (
      period?.form_5110_40_status === 'submitted' &&
      period?.form_5110_11_status === 'submitted' &&
      period?.form_5110_28_status === 'submitted'
    ) {
      skipped++
      continue
    }

    // Count activity in prior month across all production/processing tables
    const [mashCount, fermCount, distCount, bottlingCount] = await Promise.all([
      admin.from('mash_batches').select('id', { count: 'exact', head: true })
        .eq('distillery_id', dist.id).gte('mash_date', priorStartISO).lte('mash_date', priorEndISO),
      admin.from('fermentation_logs').select('id', { count: 'exact', head: true })
        .eq('distillery_id', dist.id).gte('start_date', priorStartISO).lte('start_date', priorEndISO),
      admin.from('distillation_logs').select('id', { count: 'exact', head: true })
        .eq('distillery_id', dist.id).gte('distillation_date', priorStartISO).lte('distillation_date', priorEndISO),
      admin.from('bottling_records').select('id', { count: 'exact', head: true })
        .eq('distillery_id', dist.id).gte('bottling_date', priorStartISO).lte('bottling_date', priorEndISO),
    ])

    const totalActivity = (mashCount.count ?? 0) + (fermCount.count ?? 0) + (distCount.count ?? 0) + (bottlingCount.count ?? 0)

    if (totalActivity > 0) {
      skipped++
      continue
    }

    // Zero activity — send reminder
    const { data: ownerData } = await admin.auth.admin.getUserById(dist.owner_id)
    const email = ownerData?.user?.email
    if (!email) continue

    const periodLabel = priorMonthStart.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    const dueDate = new Date(now.getFullYear(), now.getMonth(), 15).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

    const subject = `Reminder: Zero-activity TTB reports due by the 15th — ${periodLabel}`
    const text = `${dist.name},

Even with no production or processing activity in ${periodLabel}, TTB requires you to file:

  • Form 5110.40 (Monthly Report of Production Operations)
  • Form 5110.11 (Monthly Report of Storage Operations)
  • Form 5110.28 (Monthly Report of Processing Operations)

These must be filed showing zero activity — failure to file is a violation of 27 CFR 19.631.

Reports are due by ${dueDate}. Log in to Still to review and file:
https://barrel-tracker.vercel.app/compliance

If you did have activity and it has not been logged, please log it before filing.`

    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Still <compliance@barrel-tracker.vercel.app>',
          to: email,
          subject,
          text,
        }),
      }).catch(() => {})
    } else {
      console.log(`[CRON] zero-activity reminder needed for distillery ${dist.id} (${dist.name})`)
    }
    sent++
  }

  return NextResponse.json({ sent, skipped, period: periodKey })
}
