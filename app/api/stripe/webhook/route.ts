import { headers } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: NextRequest) {
  if (!stripe) return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })

  const body = await req.text()
  const sig = headers().get('stripe-signature')!
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const sub = event.data.object as any

  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const plan = sub.metadata?.plan || 'core'
    await admin.from('subscriptions').upsert({
      stripe_subscription_id: sub.id,
      stripe_customer_id: sub.customer,
      plan,
      status: sub.status,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'stripe_subscription_id' })
  }

  if (event.type === 'customer.subscription.deleted') {
    await admin.from('subscriptions')
      .update({ status: 'canceled', updated_at: new Date().toISOString() })
      .eq('stripe_subscription_id', sub.id)
  }

  if (event.type === 'checkout.session.completed') {
    const session = sub
    const amountTotal = session.amount_total ? session.amount_total / 100 : 0
    if (session.metadata?.barrelId && session.metadata?.consumerId) {
      await admin.from('adoptions')
        .update({ price_paid: amountTotal, status: 'active' })
        .eq('stripe_payment_intent', session.id)
        .eq('consumer_id', session.metadata.consumerId)
    }
  }

  return NextResponse.json({ received: true })
}
