import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import { ChatPanel } from '@/components/ai/ChatPanel'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: distillery } = await supabase
    .from('distilleries')
    .select('name')
    .eq('owner_id', user.id)
    .order('created_at')
    .limit(1)
    .single()

  const distilleryName = distillery?.name

  return (
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
  )
}
