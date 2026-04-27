import { generateAuthenticationOptions } from '@simplewebauthn/server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost'

export async function POST() {
  // Use discoverable credentials — user doesn't need to type username first.
  // The device will present all stored Still credentials automatically.
  const options = await generateAuthenticationOptions({
    rpID: RP_ID,
    userVerification: 'preferred',
    allowCredentials: [], // empty = discoverable / passkey flow
  })

  // Store challenge without user_id (we don't know user yet)
  await admin.from('webauthn_challenges').insert({
    challenge: options.challenge,
    user_id: null,
  })

  return NextResponse.json(options)
}
