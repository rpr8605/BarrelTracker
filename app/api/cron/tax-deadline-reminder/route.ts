import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { getTaxPeriodDueDate, taxPeriodKey } from '@/lib/ttb/tax-periods'
import { daysUntil } from '@/lib/ttb/business-days'

// Vercel cron: runs on 12th and 26th of every month at 14:00 UTC
// Checks which distilleries have unfiled periods with deadlines in ≤ 3 days
export async function GET(req: NextRequest) {
  if (req.headers.get('Authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createServiceClient()
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const day = now.getDate()

  // Determine which period deadline is approaching
  const checkPeriod: [number, number, 1 | 2] = day <= 15
    ? [year, month, 1]  // Period 1 due ~29th
    : [year, month, 2]  // Period 2 due ~14th of next month
  const due = getTaxPeriodDueDate(...checkPeriod)
  const daysLeft = daysUntil(due)

  if (daysLeft > 3) return NextResponse.json({ skipped: true, days_until_due: daysLeft })

  const periodK = taxPeriodKey(...checkPeriod)
  const periodLabel = `${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} Period ${checkPeriod[2]}`

  // Get all active distilleries
  const { data: distilleries } = await admin.from('distilleries').select('id, name, owner_id')
  if (!distilleries?.length) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const dist of distilleries) {
    // Check if they have removals for this period
    const { count: removalCount } = await admin.from('tax_determined_removals')
      .select('id', { count: 'exact', head: true })
      .eq('distillery_id', dist.id)
      .eq('tax_period', periodK)

    // Get owner email
    const { data: ownerData } = await admin.auth.admin.getUserById(dist.owner_id)
    const email = ownerData?.user?.email
    if (!email) continue

    const msg = (removalCount ?? 0) > 0
      ? `${dist.name}: You have ${removalCount} removal(s) logged for ${periodLabel}. FET payment due ${due.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })} — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} remaining.`
      : `${dist.name}: No tax-determined removals logged for ${periodLabel}. If you had removals, log them now — FET payment deadline is ${due.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}.`

    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Still <compliance@barrel-tracker.vercel.app>',
          to: email,
          subject: `FET filing deadline in ${daysLeft} day${daysLeft !== 1 ? 's' : ''} — ${periodLabel}`,
          text: msg + '\n\nLog in to Still to review and file: https://barrel-tracker.vercel.app/tax',
        }),
      }).catch(() => {})
    }
    sent++
  }

  return NextResponse.json({ sent, period: periodK, days_until_due: daysLeft })
}
