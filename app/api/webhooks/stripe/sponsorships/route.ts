import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_WEBHOOK_SECRET || !process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY) as Stripe

  const body = await req.text()
  const sig = req.headers.get('stripe-signature') ?? ''

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (event.type !== 'checkout.session.completed') {
    return NextResponse.json({ received: true })
  }

  const session = event.data.object as Stripe.Checkout.Session
  const meta = session.metadata ?? {}
  const sponsorshipId = meta.sponsorshipId

  if (!sponsorshipId) return NextResponse.json({ received: true })

  const db = createServiceClient()

  // Activate the sponsorship
  await db
    .from('sponsorships')
    .update({
      status: 'ACTIVE',
      stripe_payment_intent_id: session.payment_intent as string,
      starts_at: new Date().toISOString(),
    })
    .eq('id', sponsorshipId)

  // Send confirmation email if Resend is configured
  if (process.env.RESEND_API_KEY && meta.sponsorName && session.customer_email) {
    const { Resend } = await import('resend')
    const resend = new Resend(process.env.RESEND_API_KEY)
    await resend.emails.send({
      from: process.env.EMAIL_FROM ?? 'Still <noreply@stilldistillery.app>',
      to: session.customer_email,
      subject: `Your barrel sponsorship is confirmed — ${meta.sponsorName}`,
      html: `
        <h2>Thank you for sponsoring Barrel #${meta.barrelId?.slice(0, 8) ?? ''}!</h2>
        <p>Your ${meta.tier} sponsorship is now active. You'll be notified at every barrel milestone.</p>
        <p>Your certificate will be delivered separately.</p>
        <br>
        <p>— The Still Team</p>
      `,
    })

    // If gift, notify recipient
    if (meta.isGift === 'true' && meta.giftEmail) {
      await resend.emails.send({
        from: process.env.EMAIL_FROM ?? 'Still <noreply@stilldistillery.app>',
        to: meta.giftEmail,
        subject: `You received a barrel sponsorship from ${meta.sponsorName}!`,
        html: `
          <h2>A gift has been made in your name!</h2>
          <p>${meta.sponsorName} has sponsored a barrel in your honor at the ${meta.tier} tier.</p>
          <p>Visit <a href="${process.env.NEXT_PUBLIC_APP_URL}/barrel/${meta.token}">your barrel's page</a> to learn more.</p>
          <br>
          <p>— The Still Team</p>
        `,
      })
    }
  }

  // Log notification
  const { data: sponsorship } = await db
    .from('sponsorships')
    .select('consumer_id, barrel_id, distillery_id')
    .eq('id', sponsorshipId)
    .single()

  if (sponsorship?.consumer_id) {
    await db.from('notification_log').insert({
      consumer_id: sponsorship.consumer_id,
      distillery_id: sponsorship.distillery_id,
      barrel_id: sponsorship.barrel_id,
      type: 'SPONSORSHIP_UPDATE',
      payload: { sponsorshipId, tier: meta.tier, status: 'ACTIVE' },
    })
  }

  return NextResponse.json({ received: true })
}
