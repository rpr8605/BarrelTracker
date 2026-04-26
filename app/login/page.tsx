'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function signIn() {
    if (!username.trim() || !password) return
    setLoading(true)
    setError('')

    try {
      // Resolve username → email (hidden from user)
      const res = await fetch('/api/auth/resolve-username', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
      })
      const { email, error: lookupErr } = await res.json()
      if (lookupErr || !email) {
        setError('Username not found')
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
      if (authErr) {
        setError('Incorrect password')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch {
      setError('Something went wrong — try again')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-medium text-primary mb-1">Still</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Distillery management</p>
        </div>

        <div className="card p-6 space-y-4">
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="e.g. WFRANCIS"
            autoComplete="username"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
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

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button
            onClick={signIn}
            loading={loading}
            disabled={!username.trim() || !password}
            className="w-full"
            size="lg"
          >
            Sign in
          </Button>

          <p className="text-xs text-center text-[var(--color-text-muted)]">
            Contact your administrator if you need access.
          </p>
        </div>
      </div>
    </div>
  )
}
