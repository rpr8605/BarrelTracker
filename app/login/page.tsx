'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'magic' | 'password'>('magic')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function signIn() {
    setLoading(true)
    setError('')
    const supabase = createClient()

    if (mode === 'magic') {
      const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: `${window.location.origin}/` } })
      if (error) setError(error.message)
      else setSent(true)
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
      else router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-medium text-primary mb-1">Still</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Distillery management</p>
        </div>

        {sent ? (
          <div className="card p-6 text-center space-y-3">
            <div className="text-3xl">✉</div>
            <p className="font-medium">Check your email</p>
            <p className="text-sm text-[var(--color-text-muted)]">We sent a sign-in link to {email}</p>
            <button onClick={() => setSent(false)} className="text-sm text-primary hover:underline min-h-[44px]">
              Try a different email
            </button>
          </div>
        ) : (
          <div className="card p-6 space-y-4">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />

            {mode === 'password' && (
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            )}

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button onClick={signIn} loading={loading} disabled={!email} className="w-full" size="lg">
              {mode === 'magic' ? 'Send sign-in link' : 'Sign in'}
            </Button>

            <div className="text-center">
              <button
                onClick={() => setMode(mode === 'magic' ? 'password' : 'magic')}
                className="text-sm text-[var(--color-text-muted)] hover:text-primary transition-colors min-h-[44px]"
              >
                {mode === 'magic' ? 'Use password instead' : 'Use magic link instead'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
