import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient, createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest, { params }: { params: { dropId: string } }) {
  try {
    const { bottleCount } = await req.json()
    if (!bottleCount || bottleCount < 1 || bottleCount > 6) {
      return NextResponse.json({ error: 'Invalid bottle count (1-6)' }, { status: 400 })
    }

    const supabase = createServiceClient()
    const authClient = createServerSupabaseClient()
    const { data: { user } } = await authClient.auth.getUser()

    // Fetch the drop
    const { data: drop } = await supabase
      .from('drop_events')
      .select('*, distilleries(name, slug)')
      .eq('id', params.dropId)
      .single()

    if (!drop) {
      return NextResponse.json({ error: 'Drop not found' }, { status: 404 })
    }

    const now = new Date()
    const opensAt = drop.opens_at ? new Date(drop.opens_at) : null
    const closesAt = drop.closes_at ? new Date(drop.closes_at) : null

    if (drop.status !== 'open') {
      return NextResponse.json({ error: 'This release is not currently open' }, { status: 400 })
    }
    if (opensAt && opensAt > now) {
      return NextResponse.json({ error: 'This release has not opened yet' }, { status: 400 })
    }
    if (closesAt && closesAt < now) {
      return NextResponse.json({ error: 'This release has closed' }, { status: 400 })
    }
    if (drop.bottles_remaining < bottleCount) {
      return NextResponse.json({ error: 'Not enough bottles remaining' }, { status: 400 })
    }

    // If Stripe is configured, create a checkout session
    const stripeKey = process.env.STRIPE_SECRET_KEY
    if (stripeKey) {
      try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(stripeKey, { apiVersion: '2024-06-20' as never })
        const session = await stripe.checkout.sessions.create({
          mode: 'payment',
          line_items: [
            {
              price_data: {
                currency: 'usd',
                product_data: {
                  name: `${drop.title} — ${bottleCount} bottle${bottleCount > 1 ? 's' : ''}`,
                },
                unit_amount: Math.round(drop.price_per_bottle * 100),
              },
              quantity: bottleCount,
            },
          ],
          success_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://barrel-tracker.vercel.app'}/drops/${params.dropId}?success=1`,
          cancel_url: `${process.env.NEXT_PUBLIC_APP_URL || 'https://barrel-tracker.vercel.app'}/drops/${params.dropId}`,
          customer_email: user?.email,
          metadata: {
            drop_id: params.dropId,
            bottle_count: String(bottleCount),
            user_id: user?.id || '',
          },
        })
        return NextResponse.json({ url: session.url })
      } catch (stripeErr) {
        console.error('Stripe error:', stripeErr)
        // Fall through to contact message
      }
    }

    // No Stripe — return contact info
    const slug = drop.distilleries?.slug || 'distillery'
    return NextResponse.json({
      message: `To purchase ${bottleCount} bottle${bottleCount > 1 ? 's' : ''} of ${drop.title}, please contact us directly.`,
      email: `info@${slug}.com`,
    })
  } catch (err) {
    console.error('Purchase error:', err)
    return NextResponse.json({ error: 'Purchase failed' }, { status: 500 })
  }
}
