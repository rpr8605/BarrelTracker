import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Sign in to adopt a barrel' }, { status: 401 })

  const { barrelId, tier, returnUrl } = await req.json()
  if (!barrelId || !tier) return NextResponse.json({ error: 'Missing barrelId or tier' }, { status: 400 })
  if (tier !== 'full' && tier !== 'share') return NextResponse.json({ error: 'Invalid tier' }, { status: 400 })

  const admin = createServiceClient()

  const { data: barrel } = await admin.from('barrels').select('id, barrel_number, distillery_id, status').eq('id', barrelId).single()
  if (!barrel) return NextResponse.json({ error: 'Barrel not found' }, { status: 404 })
  if (barrel.status === 'bottled' || barrel.status === 'dumped') {
    return NextResponse.json({ error: 'This barrel is no longer available for adoption' }, { status: 409 })
  }

  // Resolve or create consumer_profile
  let { data: profile } = await admin.from('consumer_profiles').select('id').eq('user_id', user.id).maybeSingle()
  if (!profile) {
    const { data: created } = await admin
      .from('consumer_profiles')
      .insert({ user_id: user.id, display_name: user.email?.split('@')[0] || 'User' })
      .select('id')
      .single()
    profile = created
  }
  if (!profile) return NextResponse.json({ error: 'Profile error' }, { status: 500 })

  const { data: distillery } = await admin.from('distilleries').select('id, name').eq('id', barrel.distillery_id).single()
  const distilleryName = distillery?.name ?? 'the distillery'
  const distilleryProfileUrl = distillery ? `/distillery/${distillery.id}` : '/'

  if (!stripe) {
    return NextResponse.json({
      message: 'Contact distillery directly',
      contactUrl: distilleryProfileUrl,
      distilleryName,
    })
  }

  const amount = tier === 'full' ? 250000 : 25000 // cents
  const label = tier === 'full' ? 'Full Barrel Adoption' : 'Share Adoption (1/10 Barrel)'
  const origin = returnUrl ? new URL(returnUrl).origin : process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: 'usd',
          unit_amount: amount,
          product_data: {
            name: `${label} — Barrel ${barrel.barrel_number}`,
            description: `${distilleryName} · ${tier === 'full' ? 'Exclusive full barrel adoption' : '1/10 share adoption'}`,
          },
        },
      },
    ],
    metadata: { barrelId, tier, userId: user.id, consumerId: profile.id, distilleryId: barrel.distillery_id },
    success_url: `${origin}/adopt/${barrelId}?adopted=1`,
    cancel_url: returnUrl ?? `${origin}/adopt/${barrelId}`,
    customer_email: user.email,
  })

  // Record pending adoption — price_paid is 0 until Stripe webhook confirms
  await admin.from('adoptions').insert({
    consumer_id: profile.id,
    barrel_id: barrelId,
    distillery_id: barrel.distillery_id,
    tier,
    price_paid: 0,
    status: 'active',
    stripe_payment_intent: session.id,
  })

  return NextResponse.json({ checkoutUrl: session.url })
}
