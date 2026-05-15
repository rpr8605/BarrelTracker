import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import { ChatPanel } from '@/components/ai/ChatPanel'
import { RoleProvider } from '@/lib/role-context'
import { WalkthroughProvider } from '@/components/walkthrough/WalkthroughProvider'
import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/role-context'

interface AccessibleDistillery {
  id: string
  name: string
  role: UserRole
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createServiceClient()
  const accessible: AccessibleDistillery[] = []

  const { data: owned } = await admin.from('distilleries').select('id, name').eq('owner_id', user.id)
  for (const d of owned || []) {
    accessible.push({ id: d.id, name: d.name, role: 'owner' })
  }

  const { data: roles } = await admin
    .from('user_roles')
    .select('role, distillery_id, distilleries(id, name)')
    .eq('user_id', user.id)

  for (const r of roles || []) {
    const dist = (r.distilleries as unknown) as { id: string; name: string } | null
    if (!dist) continue
    const existing = accessible.findIndex((a) => a.id === dist.id)
    if (existing >= 0) {
      accessible[existing].role = r.role as UserRole
    } else {
      accessible.push({ id: dist.id, name: dist.name, role: r.role as UserRole })
    }
  }

  // Determine active distillery from cookie or default to first
  const cookieStore = cookies()
  const preferred = cookieStore.get('active_distillery')?.value
  const active = accessible.find((d) => d.id === preferred) || accessible[0]

  // Demo detection (onboarding wizard temporarily disabled — users skip straight to app).
  // Re-enable by setting NEXT_PUBLIC_ONBOARDING_ENABLED=1 in env.
  const onboardingEnabled = process.env.NEXT_PUBLIC_ONBOARDING_ENABLED === '1'
  let isDemo = false
  if (active) {
    const { data: distRow } = await admin
      .from('distilleries')
      .select('is_demo, onboarding_completed, onboarding_step')
      .eq('id', active.id)
      .single()
    if (distRow) {
      isDemo = !!distRow.is_demo
      if (onboardingEnabled && !distRow.is_demo && !distRow.onboarding_completed) {
        const step = Math.max(1, Math.min(5, distRow.onboarding_step ?? 1))
        redirect(`/onboarding/${step}`)
      }
    }
  }

  // If no distillery resolved, fall back to a placeholder so the shell renders
  const activeName = active?.name ?? 'Still'
  const activeId = active?.id ?? ''
  const activeRole: UserRole = active?.role ?? 'full_access'

  return (
    <RoleProvider role={activeRole}>
      <WalkthroughProvider userId={user.id} autoStart={isDemo}>
        <div className="flex min-h-screen bg-[var(--color-bg)]">
          <Sidebar
            distilleryName={activeName}
            allDistilleries={accessible.map((d) => ({ id: d.id, name: d.name }))}
            activeDistilleryId={activeId}
          />
          <div className="flex-1 flex flex-col min-w-0">
            <Header distilleryName={activeName} />
            {isDemo && (
              <div className="bg-[#BA7517] text-white px-4 py-2 text-xs font-medium text-center">
                YOU&apos;RE IN DEMO MODE · Data resets every 24 hours · Book a real demo at{' '}
                <span className="underline">still-consulting.com</span>
              </div>
            )}
            <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-7xl w-full mx-auto">
              {children}
            </main>
          </div>
          <BottomNav />
          <ChatPanel />
        </div>
      </WalkthroughProvider>
    </RoleProvider>
  )
}
