import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export function getActiveDistilleryId(): string | undefined {
  return cookies().get('active_distillery')?.value
}

// Use ONLY for auth.getUser() — the anon key reads the session cookie properly
export function createServerSupabaseClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}

// Use for ALL database queries — raw service role client bypasses RLS entirely.
// Do NOT use createServerClient here: @supabase/ssr forwards the user's session
// JWT as the Authorization Bearer header even when initialized with the service
// role key, which prevents PostgREST from recognizing the service role and
// applying it correctly. The raw createClient sends ONLY the service role key.
export function createServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
