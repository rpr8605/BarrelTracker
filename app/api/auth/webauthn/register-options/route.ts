import { generateRegistrationOptions } from '@simplewebauthn/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const RP_NAME = 'Still Distillery'
const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost'

export async function GET() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Fetch existing credentials to exclude from registration
  const { data: existing } = await admin
    .from('webauthn_credentials')
    .select('id, transports')
    .eq('user_id', user.id)

  const options = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID: RP_ID,
    userID: new TextEncoder().encode(user.id),
    userName: user.email || user.id,
    attestationType: 'none',
    authenticatorSelection: {
      residentKey: 'preferred',
      userVerification: 'preferred',
      authenticatorAttachment: 'platform', // built-in Face ID / Touch ID only
    },
    excludeCredentials: (existing || []).map((c) => ({
      id: c.id,
      transports: c.transports as AuthenticatorTransport[],
    })),
  })

  // Store challenge server-side (Vercel is stateless)
  await admin.from('webauthn_challenges').insert({
    challenge: options.challenge,
    user_id: user.id,
  })

  return NextResponse.json(options)
}
