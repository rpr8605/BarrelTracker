'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRouter } from 'next/navigation'
import { ENVIRONMENTS } from '@/lib/environments'
import type { AppEnvironment } from '@/lib/environments'

async function getBiometricLib() {
  return import('@simplewebauthn/browser')
}

function isBiometricSupported(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
}

function getDeviceLabel(): string {
  if (typeof navigator === 'undefined') return 'biometric'
  const ua = navigator.userAgent
  if (/iPhone|iPad/.test(ua)) return 'Face ID'
  if (/Android/.test(ua)) return 'fingerprint'
  return 'biometric'
}

async function setActiveDistillery(environmentId: string): Promise<void> {
  try {
    const res = await fetch('/api/auth/resolve-distillery', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ environmentId }),
    })
    const { distilleryId } = await res.json()
    if (!distilleryId) return
    await fetch('/api/distillery/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distilleryId }),
    })
  } catch {
    // Non-fatal — user can switch manually in app
  }
}

export default function LoginPage() {
  const router = useRouter()
  const [env, setEnv] = useState<AppEnvironment>(ENVIRONMENTS[0])
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)
  const [error, setError] = useState('')
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [biometricRegistered, setBiometricRegistered] = useState(false)
  const deviceLabel = getDeviceLabel()

  useEffect(() => {
    if (!isBiometricSupported()) return
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable().then((avail) => {
      setBiometricAvailable(avail)
      setBiometricRegistered(localStorage.getItem('still_webauthn_registered') === 'true')
    })
  }, [])

  function selectEnv(id: string) {
    const found = ENVIRONMENTS.find((e) => e.id === id) || ENVIRONMENTS[0]
    setEnv(found)
    setError('')
  }

  async function enterDemo() {
    if (!displayName.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/demo-login', { method: 'POST' })
      const data = await res.json()
      if (!data.ok) { setError(data.error || 'Demo unavailable'); setLoading(false); return }
      localStorage.setItem('still_display_name', displayName.trim())
      router.push('/dashboard')
    } catch {
      setError('Could not reach demo — try again')
      setLoading(false)
    }
  }

  async function signIn() {
    if (!username.trim() || !password) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/resolve-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      })
      const { email, error: lookupErr } = await res.json()
      if (lookupErr || !email) { setError('Username not found'); setLoading(false); return }

      const supabase = createClient()
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) { setError('Incorrect password'); setLoading(false); return }

      // Auto-switch to the selected environment's distillery
      await setActiveDistillery(env.id)

      router.push('/dashboard')
    } catch {
      setError('Something went wrong — try again')
      setLoading(false)
    }
  }

  async function biometricSignIn() {
    setBiometricLoading(true)
    setError('')
    try {
      const { startAuthentication } = await getBiometricLib()
      const optRes = await fetch('/api/auth/webauthn/auth-options', { method: 'POST' })
      const options = await optRes.json()
      const authResponse = await startAuthentication({ optionsJSON: options })
      const verRes = await fetch('/api/auth/webauthn/auth-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(authResponse),
      })
      const verData = await verRes.json()
      if (!verData.verified) { setError(verData.error || 'Biometric failed'); setBiometricLoading(false); return }

      const supabase = createClient()
      const { error: otpErr } = await supabase.auth.verifyOtp({
        token_hash: verData.tokenHash,
        type: 'magiclink',
      })
      if (otpErr) { setError('Session error — sign in with password'); setBiometricLoading(false); return }

      await setActiveDistillery(env.id)
      router.push('/dashboard')
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : ''
      if (!msg.includes('cancel') && !msg.includes('NotAllowed') && !msg.includes('Abort')) {
        setError(`${deviceLabel} sign-in failed — use username and password`)
      }
      setBiometricLoading(false)
    }
  }

  const canSubmit = env.passwordless ? displayName.trim().length > 0 : username.trim().length > 0 && password.length > 0

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-medium text-primary mb-1">Still</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Distillery management</p>
        </div>

        <div className="card p-6 space-y-4">
          {/* Environment selector */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-muted)] mb-1.5">
              Environment
            </label>
            <select
              value={env.id}
              onChange={(e) => selectEnv(e.target.value)}
              className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] px-3 py-2.5 text-sm focus:outline-none focus:border-primary min-h-[44px] cursor-pointer"
            >
              {ENVIRONMENTS.map((e) => (
                <option key={e.id} value={e.id}>{e.label}</option>
              ))}
            </select>
          </div>

          {/* Demo: any display name, no password */}
          {env.passwordless ? (
            <>
              <Input
                label="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Enter any name"
                autoComplete="name"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && enterDemo()}
              />
              <p className="text-xs text-[var(--color-text-muted)]">
                No password needed — explore 500+ practice barrels freely.
              </p>
            </>
          ) : (
            /* Named environments: username + password */
            <>
              <Input
                label="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. WFRANCIS"
                autoComplete="username"
                autoCapitalize="characters"
                autoCorrect="off"
                spellCheck={false}
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && signIn()}
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                onKeyDown={(e) => e.key === 'Enter' && signIn()}
              />
            </>
          )}

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button
            onClick={env.passwordless ? enterDemo : signIn}
            loading={loading}
            disabled={!canSubmit}
            className="w-full"
            size="lg"
          >
            {env.passwordless ? 'Enter Demo' : 'Sign in'}
          </Button>

          {/* Biometric login — only for users who have already registered a credential */}
          {biometricAvailable && biometricRegistered && !env.passwordless && (
            <>
              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-[var(--color-border)]" />
                <span className="text-xs text-[var(--color-text-muted)]">or</span>
                <div className="flex-1 h-px bg-[var(--color-border)]" />
              </div>
              <Button
                variant="secondary"
                onClick={biometricSignIn}
                loading={biometricLoading}
                className="w-full"
                size="lg"
              >
                Sign in with {deviceLabel}
              </Button>
            </>
          )}

          {biometricAvailable && !biometricRegistered && !env.passwordless && (
            <p className="text-xs text-center text-[var(--color-text-muted)]">
              After signing in you can enable {deviceLabel} in Settings.
            </p>
          )}
        </div>

        <p className="text-xs text-center text-[var(--color-text-muted)]">
          Need access? Contact your administrator.
        </p>
      </div>
    </div>
  )
}
