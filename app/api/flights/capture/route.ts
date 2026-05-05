import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const { name, email, barrelIds, distilleryId } = await req.json()
    if (!email || !barrelIds?.length || !distilleryId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Upsert consumer profile
    const { data: profile } = await supabase
      .from('consumer_profiles')
      .upsert({ email, name: name || null }, { onConflict: 'email' })
      .select('id')
      .single()

    const consumerId = profile?.id

    // Insert notification subscriptions for each barrel
    if (consumerId && barrelIds.length > 0) {
      const subs = barrelIds.map((barrelId: string) => ({
        consumer_id: consumerId,
        barrel_id: barrelId,
        distillery_id: distilleryId,
        type: 'milestone',
        email,
      }))

      await supabase
        .from('notification_subscriptions')
        .upsert(subs, { onConflict: 'consumer_id,barrel_id,type' })
    }

    // Optionally add to Resend audience
    const resendKey = process.env.RESEND_API_KEY
    const resendAudienceId = process.env.RESEND_AUDIENCE_ID
    if (resendKey && resendAudienceId) {
      try {
        await fetch(`https://api.resend.com/audiences/${resendAudienceId}/contacts`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email, first_name: name?.split(' ')[0] || '', unsubscribed: false }),
        })
      } catch {
        // Non-fatal — Resend is optional
      }
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Flight capture error:', err)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
