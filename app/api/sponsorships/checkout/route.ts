import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'
import Stripe from 'stripe'

const PLATFORM_FEE_PCT = 0.10

export async function POST(req: NextRequest) {
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 })
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const stripe = new (Stripe as any)(process.env.STRIPE_SECRET_KEY) as Stripe

  const {
    barrelId, distilleryId, tier, amountCents, sponsorName, sponsorEmail,
    isGift, giftEmail, token,
  } = await req.json()

  if (!barrelId || !distilleryId || !tier || !amountCents || !sponsorName || !sponsorEmail) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const db = createServiceClient()

  // Get consumer if logged in
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  let consumerId: string | null = null
  if (user) {
    const { data: cp } = await db.from('consumer_profiles').select('id').eq('user_id', user.id).single()
    consumerId = cp?.id ?? null
  }

  // Get distillery for branding
  const { data: distillery } = await db
    .from('distilleries')
    .select('name, brand_color')
    .eq('id', distilleryId)
    .single()

  const { data: barrel } = await db
    .from('barrels')
    .select('barrel_number')
    .eq('id', barrelId)
    .single()

  const platformFeeCents = Math.floor(amountCents * PLATFORM_FEE_PCT)

  // Create pending sponsorship record
  const { data: sponsorship, error: spError } = await db
    .from('sponsorships')
    .insert({
      distillery_id: distilleryId,
      barrel_id: barrelId,
      consumer_id: consumerId,
      tier,
      sponsor_name: sponsorName,
      sponsor_email: sponsorEmail,
      amount_cents: amountCents,
      platform_fee_cents: platformFeeCents,
      status: 'PENDING',
      is_gift: isGift ?? false,
      gift_recipient_email: isGift ? giftEmail : null,
    })
    .select('id')
    .single()

  if (spError) return NextResponse.json({ error: spError.message }, { status: 500 })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: sponsorEmail,
    line_items: [{
      price_data: {
        currency: 'usd',
        unit_amount: amountCents,
        product_data: {
          name: `Barrel #${barrel?.barrel_number ?? barrelId} Sponsorship — ${tier}`,
          description: `${distillery?.name ?? 'Distillery'} | Sponsored by ${sponsorName}`,
        },
      },
      quantity: 1,
    }],
    metadata: {
      sponsorshipId: sponsorship.id,
      barrelId,
      distilleryId,
      tier,
      sponsorName,
      isGift: String(isGift ?? false),
      giftEmail: giftEmail ?? '',
      token: token ?? '',
    },
    success_url: `${appUrl}/barrel/${token}?sponsored=true`,
    cancel_url: `${appUrl}/barrel/${token}/sponsor?tier=${tier}`,
  })

  return NextResponse.json({ url: session.url })
}
