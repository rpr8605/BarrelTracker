import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { getDistilleryPlan } from '@/lib/subscription'
import { PLANS } from '@/lib/stripe'
import { Card } from '@/components/ui/Card'
import { CheckCircle2, Circle } from 'lucide-react'

export default async function BillingPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const distilleryId = getActiveDistilleryId()
  if (!distilleryId) redirect('/onboarding')

  const currentPlan = await getDistilleryPlan(distilleryId)
  const stripeConfigured = !!process.env.STRIPE_SECRET_KEY

  const planOrder: Array<keyof typeof PLANS> = ['core', 'story', 'trail']

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <h1 className="font-medium text-lg">Billing</h1>

      {/* Current plan summary */}
      <Card className="space-y-1">
        <p className="text-xs text-[var(--color-text-muted)] uppercase tracking-wide">Current plan</p>
        <p className="text-2xl font-semibold text-primary">{PLANS[currentPlan].name}</p>
        <p className="text-sm text-[var(--color-text-muted)]">
          ${PLANS[currentPlan].price}<span className="text-xs">/mo</span>
        </p>
      </Card>

      {/* Plan cards */}
      <div className="space-y-3">
        {planOrder.map((key) => {
          const plan = PLANS[key]
          const isCurrent = key === currentPlan
          const isUpgrade = planOrder.indexOf(key) > planOrder.indexOf(currentPlan)

          return (
            <Card
              key={key}
              className={`space-y-3 ${isCurrent ? 'ring-2 ring-primary' : ''}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{plan.name}</p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    ${plan.price}<span className="text-xs">/mo</span>
                  </p>
                </div>
                {isCurrent && (
                  <span className="text-xs bg-primary/10 text-primary font-medium px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </div>

              <ul className="space-y-1.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-xs text-[var(--color-text-muted)]">
                    <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
                    {f}
                  </li>
                ))}
              </ul>

              {isUpgrade && (
                <div className="pt-1">
                  {stripeConfigured ? (
                    <a
                      href={`/api/stripe/checkout?plan=${key}&distillery_id=${distilleryId}`}
                      className="inline-block w-full text-center text-sm font-medium bg-primary text-white rounded-lg py-2 hover:bg-primary/90 transition-colors"
                    >
                      Upgrade to {plan.name}
                    </a>
                  ) : (
                    <a
                      href="mailto:ryan@stilldistillery.app?subject=Upgrade%20to%20Still%20{plan.name}"
                      className="inline-block w-full text-center text-sm font-medium border border-primary text-primary rounded-lg py-2 hover:bg-primary/5 transition-colors"
                    >
                      Contact us to upgrade
                    </a>
                  )}
                </div>
              )}
            </Card>
          )
        })}
      </div>

      {/* Manage billing */}
      <Card className="space-y-2">
        <h2 className="text-sm font-medium">Manage billing</h2>
        {stripeConfigured ? (
          <a
            href={`/api/stripe/portal?distillery_id=${distilleryId}`}
            className="inline-block text-sm text-primary underline underline-offset-2"
          >
            Open billing portal
          </a>
        ) : (
          <p className="text-xs text-[var(--color-text-muted)]">
            To change or cancel your plan, email{' '}
            <a href="mailto:ryan@stilldistillery.app" className="text-primary underline underline-offset-2">
              ryan@stilldistillery.app
            </a>
          </p>
        )}
      </Card>
    </div>
  )
}
