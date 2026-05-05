import { validateMasterAccess } from '@/lib/master-auth'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Still — Master Admin',
  robots: { index: false, follow: false },
}

export default async function MasterLayout({ children }: { children: React.ReactNode }) {
  const { ok } = await validateMasterAccess()
  if (!ok) redirect('/dashboard')

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white" style={{ borderLeft: '3px solid #854F0B' }}>
      {children}
    </div>
  )
}
