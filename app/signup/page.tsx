'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const next = searchParams.get('next') || '/dashboard'
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [distilleryName, setDistilleryName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSignup() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, username, email, password, distilleryName }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Signup failed')
        setLoading(false)
        return
      }

      const supabase = createClient()
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password })
      if (signInErr) {
        setError('Account created — please sign in')
        setLoading(false)
        router.push('/login')
        return
      }

      router.push(next)
    } catch {
      setError('Something went wrong — try again')
      setLoading(false)
    }
  }

  const canSubmit =
    fullName.trim().length > 0 &&
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 6 &&
    distilleryName.trim().length > 0

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-medium text-primary mb-1">Still</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Create your account</p>
        </div>

        <div className="card p-6 space-y-4">
          <Input
            label="Full name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="William Francis"
            autoComplete="name"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSignup()}
          />
          <Input
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            placeholder="WFRANCIS"
            autoComplete="username"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSignup()}
          />
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="william@distillery.com"
            autoComplete="email"
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSignup()}
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSignup()}
          />
          <Input
            label="Distillery name"
            value={distilleryName}
            onChange={(e) => setDistilleryName(e.target.value)}
            placeholder="Blue Ridge Spirits"
            autoComplete="organization"
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleSignup()}
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button
            onClick={handleSignup}
            loading={loading}
            disabled={!canSubmit}
            className="w-full"
            size="lg"
          >
            Create account
          </Button>
        </div>

        <p className="text-xs text-center text-[var(--color-text-muted)]">
          Already have an account?{' '}
          <Link href="/login" className="text-primary underline-offset-2 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
