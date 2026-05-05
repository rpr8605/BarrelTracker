'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [identifier, setIdentifier] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)

  async function handleSubmit() {
    const value = identifier.trim()
    if (!value) return
    setLoading(true)
    setError('')

    try {
      let email = value

      // If no @ sign, treat as username and resolve to email
      if (!value.includes('@')) {
        const res = await fetch('/api/auth/resolve-username', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: value }),
        })
        const data = await res.json()
        if (data.error || !data.email) {
          setError('Username not found')
          setLoading(false)
          return
        }
        email = data.email
      }

      const supabase = createClient()
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '/reset-password',
      })

      if (resetErr) {
        setError(resetErr.message)
        setLoading(false)
        return
      }

      setSent(true)
    } catch {
      setError('Something went wrong — try again')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-medium text-primary mb-1">Still</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Reset your password</p>
        </div>

        <div className="card p-6 space-y-4">
          {sent ? (
            <div className="space-y-4">
              <p className="text-sm text-[var(--color-text)]">
                Check your email for a password reset link.
              </p>
              <p className="text-xs text-[var(--color-text-muted)]">
                Didn&apos;t get it? Check your spam folder or try again.
              </p>
              <Button
                variant="secondary"
                onClick={() => { setSent(false); setIdentifier('') }}
                className="w-full"
                size="lg"
              >
                Try again
              </Button>
            </div>
          ) : (
            <>
              <Input
                label="Email or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="WFRANCIS or william@distillery.com"
                autoComplete="email"
                autoFocus
                onKeyDown={(e) => e.key === 'Enter' && identifier.trim() && handleSubmit()}
              />

              {error && <p className="text-sm text-danger">{error}</p>}

              <Button
                onClick={handleSubmit}
                loading={loading}
                disabled={!identifier.trim()}
                className="w-full"
                size="lg"
              >
                Send reset link
              </Button>
            </>
          )}
        </div>

        <p className="text-xs text-center text-[var(--color-text-muted)]">
          <Link href="/login" className="text-primary underline-offset-2 hover:underline">
            Back to sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
