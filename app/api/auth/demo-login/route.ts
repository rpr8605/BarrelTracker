import { createServerSupabaseClient } from '@/lib/supabase-server'
import { NextResponse } from 'next/server'

// Shared demo account — anyone who picks the Demo environment signs in as this user.
// The display name they type is stored client-side (localStorage) only.
const DEMO_EMAIL = 'demo-system@stilldemo.com'
const DEMO_PASSWORD = 'DemoSystem2024!'

export async function POST() {
  const supabase = createServerSupabaseClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email: DEMO_EMAIL,
    password: DEMO_PASSWORD,
  })

  if (error) {
    return NextResponse.json({ error: 'Demo unavailable — try again' }, { status: 500 })
  }

  return NextResponse.json({ ok: true, userId: data.user?.id })
}
