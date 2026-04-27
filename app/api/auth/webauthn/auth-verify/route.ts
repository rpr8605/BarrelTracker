import { verifyAuthenticationResponse } from '@simplewebauthn/server'
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
  const body = await req.json()
  const credentialId = body.id

  // Find the credential in our DB
  const { data: credential } = await admin
    .from('webauthn_credentials')
    .select('*, auth_users:user_id(email)')
    .eq('id', credentialId)
    .single()

  if (!credential) return NextResponse.json({ error: 'Device not registered' }, { status: 404 })

  // Retrieve stored challenge
  const { data: challengeRow } = await admin
    .from('webauthn_challenges')
    .select('id, challenge')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!challengeRow) return NextResponse.json({ error: 'Challenge expired — try again' }, { status: 400 })

  try {
    const verification = await verifyAuthenticationResponse({
      response: body,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
      credential: {
        id: credential.id,
        publicKey: new Uint8Array(credential.public_key),
        counter: credential.counter,
        transports: credential.transports as AuthenticatorTransport[],
      },
      requireUserVerification: true,
    })

    if (!verification.verified) return NextResponse.json({ error: 'Verification failed' }, { status: 401 })

    // Update counter to prevent replay attacks
    await admin
      .from('webauthn_credentials')
      .update({ counter: verification.authenticationInfo.newCounter })
      .eq('id', credentialId)

    // Clean up challenge
    await admin.from('webauthn_challenges').delete().eq('id', challengeRow.id)

    // Get user email and generate a magic link token for session creation
    const { data: { user } } = await admin.auth.admin.getUserById(credential.user_id)
    if (!user?.email) return NextResponse.json({ error: 'Account error' }, { status: 500 })

    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
    })

    if (linkErr || !linkData) return NextResponse.json({ error: 'Session error' }, { status: 500 })

    // Return the token hash — client uses verifyOtp to establish the session
    const url = new URL(linkData.properties.action_link)
    const tokenHash = url.searchParams.get('token_hash') || linkData.properties.hashed_token

    return NextResponse.json({ verified: true, tokenHash, email: user.email })
  } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Authentication failed' }, { status: 400 })
  }
}
