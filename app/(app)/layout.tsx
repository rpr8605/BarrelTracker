import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import { ChatPanel } from '@/components/ai/ChatPanel'
import { RoleProvider } from '@/lib/role-context'
import { createServerSupabaseClient } from '@/lib/supabase-server'
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

  // Collect all distilleries this user can access
  const accessible: AccessibleDistillery[] = []

  // Owned distilleries (full access unless overridden)
  const { data: owned } = await supabase.from('distilleries').select('id, name').eq('owner_id', user.id)
  for (const d of owned || []) {
    accessible.push({ id: d.id, name: d.name, role: 'owner' })
  }

  // Role-based memberships (these override owner defaults)
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role, distillery_id, distilleries(id, name)')
    .eq('user_id', user.id)

  for (const r of roles || []) {
    const dist = (r.distilleries as unknown) as { id: string; name: string } | null
    if (!dist) continue
    const existing = accessible.findIndex((a) => a.id === dist.id)
    if (existing >= 0) {
      // Override the default owner role with the explicit role
      accessible[existing].role = r.role as UserRole
    } else {
      accessible.push({ id: dist.id, name: dist.name, role: r.role as UserRole })
    }
  }

  if (accessible.length === 0) redirect('/login')

  // Determine active distillery from cookie or default to first
  const cookieStore = cookies()
  const preferred = cookieStore.get('active_distillery')?.value
  const active = accessible.find((d) => d.id === preferred) || accessible[0]

  return (
    <RoleProvider role={active.role}>
      <div className="flex min-h-screen bg-[var(--color-bg)]">
        <Sidebar
          distilleryName={active.name}
          allDistilleries={accessible.map((d) => ({ id: d.id, name: d.name }))}
          activeDistilleryId={active.id}
        />
        <div className="flex-1 flex flex-col min-w-0">
          <Header distilleryName={active.name} />
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
