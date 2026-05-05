import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST(req: Request) {
  const body = await req.json()
  const { fullName, username, email, password, distilleryName } = body

  if (!fullName?.trim() || !username?.trim() || !email?.trim() || !password || !distilleryName?.trim()) {
    return Response.json({ error: 'All fields are required' }, { status: 400 })
  }

  const normalizedUsername = username.trim().toUpperCase()

  // Step 1: Check username uniqueness
  const { data: existing } = await admin
    .from('user_profiles')
    .select('id')
    .eq('username', normalizedUsername)
    .single()

  if (existing) {
    return Response.json({ error: 'Username already taken' }, { status: 409 })
  }

  // Step 2: Create auth user
  const { data: authData, error: authErr } = await admin.auth.admin.createUser({
    email: email.trim(),
    password,
    email_confirm: true,
    user_metadata: {
      display_name: fullName.trim(),
      username: normalizedUsername,
    },
  })

  if (authErr || !authData.user) {
    return Response.json({ error: authErr?.message || 'Failed to create account' }, { status: 400 })
  }

  const userId = authData.user.id

  // Step 3: Insert user_profiles
  const { error: profileErr } = await admin.from('user_profiles').insert({
    id: userId,
    username: normalizedUsername,
    display_name: fullName.trim(),
  })

  if (profileErr) {
    return Response.json({ error: profileErr.message }, { status: 500 })
  }

  // Step 4: Insert distillery
  const { error: distErr } = await admin.from('distilleries').insert({
    name: distilleryName.trim(),
    owner_id: userId,
  })

  if (distErr) {
    return Response.json({ error: distErr.message }, { status: 500 })
  }

  // Step 5: Insert taste_profile
  const { error: tasteErr } = await admin.from('taste_profile').insert({
    user_id: userId,
    grain_scores: {},
    flavor_scores: {},
    aging_sweet_spot_months: { min: 24, max: 36 },
    total_tastings: 0,
  })

  if (tasteErr) {
    return Response.json({ error: tasteErr.message }, { status: 500 })
  }

  // Step 6: Create consumer_profile
  await admin.from('consumer_profiles').insert({
    user_id: userId,
    display_name: fullName.trim(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })

  return Response.json({ ok: true })
}
