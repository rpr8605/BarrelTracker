import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  const { username } = await req.json()
  if (!username?.trim()) return Response.json({ error: 'Username required' }, { status: 400 })

  const { data: profile } = await admin
    .from('user_profiles')
    .select('id')
    .eq('username', username.trim().toUpperCase())
    .single()

  if (!profile) return Response.json({ error: 'Username not found' }, { status: 404 })

  const { data: { user } } = await admin.auth.admin.getUserById(profile.id)
  if (!user?.email) return Response.json({ error: 'Account error' }, { status: 500 })

  return Response.json({ email: user.email })
}
