import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { AdminSidebar } from '@/components/admin/AdminSidebar'
import { AdminHeader } from '@/components/admin/AdminHeader'
import { cookies } from 'next/headers'

export const metadata = { title: 'Admin — Still Platform' }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const db = createServiceClient()
  const { data: profile } = await db
    .from('user_profiles')
    .select('is_super_admin, display_name')
    .eq('id', user.id)
    .single()

  if (!profile?.is_super_admin) redirect('/dashboard')

  const cookieStore = cookies()
  const viewingAsId = cookieStore.get('viewing_as_distillery_id')?.value
  const viewingAsName = cookieStore.get('viewing_as_distillery_name')?.value

  return (
    <div className="flex min-h-screen bg-[var(--color-bg)]">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader
          adminName={profile.display_name}
          viewingAsName={viewingAsName}
          viewingAsId={viewingAsId}
        />
        {viewingAsName && (
          <div className="bg-amber-500 text-black px-4 py-2 flex items-center justify-between text-sm font-medium">
            <span>Viewing as: <strong>{viewingAsName}</strong></span>
            <form action="/api/admin/exit-view" method="POST">
              <button type="submit" className="underline hover:no-underline">Exit view</button>
            </form>
          </div>
        )}
        <main className="flex-1 p-4 md:p-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
