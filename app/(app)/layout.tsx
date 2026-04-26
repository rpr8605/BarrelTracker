import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import { ChatPanel } from '@/components/ai/ChatPanel'
import { RoleProvider } from '@/lib/role-context'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import type { UserRole } from '@/lib/role-context'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  let distilleryName: string | undefined
  let role: UserRole = 'read_only'

  const { data: owned } = await supabase
    .from('distilleries')
    .select('name')
    .eq('owner_id', user.id)
    .limit(1)
    .single()

  if (owned) {
    distilleryName = owned.name
    role = 'owner'
  } else {
    const { data: memberRole } = await supabase
      .from('user_roles')
      .select('role, distilleries(name)')
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (memberRole) {
      const dist = (memberRole.distilleries as unknown) as { name: string } | null
      distilleryName = dist?.name
      role = memberRole.role as UserRole
    } else {
      redirect('/onboarding')
    }
  }

  return (
    <RoleProvider role={role}>
      <div className="flex min-h-screen bg-[var(--color-bg)]">
        <Sidebar distilleryName={distilleryName} />
        <div className="flex-1 flex flex-col min-w-0">
          <Header distilleryName={distilleryName} />
          <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
        <BottomNav />
        <ChatPanel />
      </div>
    </RoleProvider>
  )
}
