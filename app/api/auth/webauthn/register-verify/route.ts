import { verifyRegistrationResponse } from '@simplewebauthn/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

const RP_ID = process.env.WEBAUTHN_RP_ID || 'localhost'
const ORIGIN = process.env.WEBAUTHN_ORIGIN || 'http://localhost:3000'

export async function POST(req: Request) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()

  // Retrieve stored challenge
  const { data: challengeRow } = await admin
    .from('webauthn_challenges')
    .select('challenge')
    .eq('user_id', user.id)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!challengeRow) return NextResponse.json({ error: 'Challenge expired — try again' }, { status: 400 })

  try {
    const verification = await verifyRegistrationResponse({
      response: body,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      requireUserVerification: true,
    })

    if (!verification.verified || !verification.registrationInfo) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 400 })
    }

    const { credential, credentialDeviceType, credentialBackedUp } = verification.registrationInfo

    // Store credential
    await admin.from('webauthn_credentials').upsert({
      id: credential.id,
      user_id: user.id,
      public_key: Buffer.from(credential.publicKey),
      counter: credential.counter,
      device_type: credentialDeviceType,
      backed_up: credentialBackedUp,
      transports: body.response?.transports || [],
    }, { onConflict: 'id' })

    // Clean up challenge
    await admin.from('webauthn_challenges').delete().eq('user_id', user.id)

    return NextResponse.json({ verified: true })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Registration failed' }, { status: 400 })
  }
}
