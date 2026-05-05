import { createServerSupabaseClient, createServiceClient } from '@/lib/supabase-server'
import { cookies } from 'next/headers'

export async function validateMasterAccess(): Promise<{
  ok: boolean
  userId?: string
  email?: string
}> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const adminKey = process.env.STILL_ADMIN_KEY
  const cookieStore = cookies()
  const cookieKey = cookieStore.get('x-still-admin-key')?.value
  if (!adminKey || cookieKey !== adminKey) return { ok: false }

  const db = createServiceClient()
  const { data: profile } = await db
    .from('user_profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_super_admin) return { ok: false }

  return { ok: true, userId: user.id, email: user.email }
}

export async function validateMasterRequest(req: Request): Promise<{
  ok: boolean
  userId?: string
  email?: string
}> {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ok: false }

  const adminKey = process.env.STILL_ADMIN_KEY
  // Check header OR cookie
  const headerKey = req.headers.get('x-still-admin-key')
  const cookieStore = cookies()
  const cookieKey = cookieStore.get('x-still-admin-key')?.value
  if (!adminKey || (headerKey !== adminKey && cookieKey !== adminKey)) return { ok: false }

  const db = createServiceClient()
  const { data: profile } = await db
    .from('user_profiles')
    .select('is_super_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_super_admin) return { ok: false }

  return { ok: true, userId: user.id, email: user.email }
}
