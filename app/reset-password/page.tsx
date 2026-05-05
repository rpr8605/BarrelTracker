'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [ready, setReady] = useState(false)
  const [sessionError, setSessionError] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setReady(true)
      } else {
        setSessionError('Invalid or expired link. Please request a new one.')
      }
    })
  }, [])

  async function handleReset() {
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const supabase = createClient()
      const { error: updateErr } = await supabase.auth.updateUser({ password: newPassword })
      if (updateErr) {
        setError(updateErr.message)
        setLoading(false)
        return
      }
      router.push('/dashboard')
    } catch {
      setError('Something went wrong — try again')
      setLoading(false)
    }
  }

  const canSubmit = newPassword.length >= 6 && confirmPassword.length >= 6

  if (sessionError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-medium text-primary mb-1">Still</h1>
            <p className="text-sm text-[var(--color-text-muted)]">Reset your password</p>
          </div>

          <div className="card p-6 space-y-4">
            <p className="text-sm text-danger">{sessionError}</p>
            <Link
              href="/forgot-password"
              className="block w-full text-center rounded-lg bg-primary text-white font-medium py-3 text-sm min-h-[44px] leading-[44px]"
            >
              Request a new link
            </Link>
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

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center">
            <h1 className="text-4xl font-medium text-primary mb-1">Still</h1>
          </div>
          <div className="card p-6">
            <p className="text-sm text-[var(--color-text-muted)] text-center">Verifying link…</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-4xl font-medium text-primary mb-1">Still</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Choose a new password</p>
        </div>

        <div className="card p-6 space-y-4">
          <Input
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            autoFocus
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleReset()}
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••••"
            autoComplete="new-password"
            onKeyDown={(e) => e.key === 'Enter' && canSubmit && handleReset()}
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button
            onClick={handleReset}
            loading={loading}
            disabled={!canSubmit}
            className="w-full"
            size="lg"
          >
            Set new password
          </Button>
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
