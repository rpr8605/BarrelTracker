import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const DEMO_EMAIL = 'demo-system@stilldemo.com'
const DEMO_PASSWORD = 'DemoSystem2024!'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

export async function POST() {
  // Sign in via admin to get session tokens, then return them to the client
  // so the browser-side Supabase can establish the session (same pattern as WebAuthn).
  const { data, error } = await admin.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })

  if (error || !data.session) {
    return NextResponse.json({ error: 'Demo unavailable — try again' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    accessToken: data.session.access_token,
    refreshToken: data.session.refresh_token,
  })
}
