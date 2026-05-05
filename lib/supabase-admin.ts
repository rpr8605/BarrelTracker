import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

export function adminClient() {
  return createClient(URL, SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export interface AdminUser {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  banned_until: string | null
  app_metadata: Record<string, unknown>
  user_metadata: Record<string, unknown>
}

export async function listUsers(params?: {
  page?: number
  perPage?: number
}) {
  const db = adminClient()
  const page = params?.page ?? 1
  const perPage = params?.perPage ?? 25
  const { data, error } = await db.auth.admin.listUsers({ page, perPage })
  if (error) throw error
  return data
}

export async function getUserById(userId: string): Promise<AdminUser> {
  const db = adminClient()
  const { data, error } = await db.auth.admin.getUserById(userId)
  if (error) throw error
  return data.user as AdminUser
}

export async function updateUserMetadata(userId: string, appMetadata: Record<string, unknown>) {
  const db = adminClient()
  const { data, error } = await db.auth.admin.updateUserById(userId, { app_metadata: appMetadata })
  if (error) throw error
  return data.user
}

export async function setUserPassword(userId: string, password: string) {
  const db = adminClient()
  const { data, error } = await db.auth.admin.updateUserById(userId, { password })
  if (error) throw error
  return data.user
}

export async function generateMagicLink(email: string): Promise<string> {
  const db = adminClient()
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://barrel-tracker.vercel.app'
  const { data, error } = await db.auth.admin.generateLink({
    type: 'magiclink',
    email,
    options: { redirectTo: appUrl + '/dashboard' },
  })
  if (error) throw error
  return (data.properties as { action_link: string }).action_link
}

export async function suspendUser(userId: string) {
  const db = adminClient()
  // 10 years = effectively permanent
  const { data, error } = await db.auth.admin.updateUserById(userId, {
    ban_duration: '87600h',
  })
  if (error) throw error
  return data.user
}

export async function reactivateUser(userId: string) {
  const db = adminClient()
  const { data, error } = await db.auth.admin.updateUserById(userId, {
    ban_duration: 'none',
  })
  if (error) throw error
  return data.user
}

export async function deleteUser(userId: string) {
  const db = adminClient()
  const { error } = await db.auth.admin.deleteUser(userId)
  if (error) throw error
}

export async function logAudit(params: {
  adminUserId: string
  adminEmail: string
  action: string
  targetUserId?: string
  targetEmail?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}) {
  const db = adminClient()
  await db.from('audit_log').insert({
    admin_user_id: params.adminUserId,
    admin_email: params.adminEmail,
    action: params.action,
    target_user_id: params.targetUserId ?? null,
    target_email: params.targetEmail ?? null,
    metadata: params.metadata ?? {},
    ip_address: params.ipAddress ?? null,
    user_agent: params.userAgent ?? null,
  })
}
