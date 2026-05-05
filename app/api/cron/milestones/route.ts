import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

// Cron route — call from Vercel cron or external scheduler
// Authorization: Bearer $CRON_SECRET
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const db = createServiceClient()
  const now = new Date()

  // Get all aging barrels with their fill dates
  const { data: barrels } = await db
    .from('barrels')
    .select('id, barrel_number, entry_date, status, distillery_id')
    .in('status', ['aging', 'ready'])
    .not('entry_date', 'is', null)

  if (!barrels || barrels.length === 0) return NextResponse.json({ processed: 0 })

  const milestones = [
    { days: 730,  label: '2-Year Straight Designation', type: 'BARREL_MILESTONE' },
    { days: 1461, label: '4 Years in Oak', type: 'BARREL_MILESTONE' },
    { days: 2557, label: '7 Years Aged', type: 'BARREL_MILESTONE' },
  ]

  let fired = 0

  for (const barrel of barrels) {
    const fillDate = new Date(barrel.entry_date as string)
    const ageDays = Math.floor((now.getTime() - fillDate.getTime()) / (1000 * 60 * 60 * 24))

    for (const milestone of milestones) {
      // Fire within a 1-day window of the milestone
      if (ageDays >= milestone.days && ageDays < milestone.days + 1) {
        // Check if we already fired this milestone
        const { count } = await db
          .from('notification_log')
          .select('id', { count: 'exact', head: true })
          .eq('barrel_id', barrel.id)
          .eq('type', 'BARREL_MILESTONE')
          .contains('payload', { milestone_days: milestone.days })

        if ((count ?? 0) > 0) continue

        // Get all followers of this barrel
        const { data: followers } = await db
          .from('follows')
          .select('consumer_id')
          .eq('entity_type', 'barrel')
          .eq('entity_id', barrel.id)

        // Log for each follower
        for (const follow of followers ?? []) {
          await db.from('notification_log').insert({
            consumer_id: follow.consumer_id,
            distillery_id: barrel.distillery_id,
            barrel_id: barrel.id,
            type: 'BARREL_MILESTONE',
            payload: {
              milestone_days: milestone.days,
              milestone_label: milestone.label,
              barrel_number: barrel.barrel_number,
            },
          })
        }

        // Log a sentinel with no consumer_id to prevent re-firing
        await db.from('notification_log').insert({
          distillery_id: barrel.distillery_id,
          barrel_id: barrel.id,
          type: 'BARREL_MILESTONE',
          payload: {
            milestone_days: milestone.days,
            milestone_label: milestone.label,
            barrel_number: barrel.barrel_number,
            is_sentinel: true,
          },
        })

        // Send push notifications via existing infrastructure
        const { notifyDistillerySubscribers } = await import('@/lib/push')
        await notifyDistillerySubscribers(barrel.distillery_id, 'milestone', {
          title: `Barrel #${barrel.barrel_number} milestone!`,
          body: milestone.label,
          icon: '/icon-192.png',
        })

        fired++
      }
    }
  }

  return NextResponse.json({ processed: barrels.length, milestonesFired: fired })
}
