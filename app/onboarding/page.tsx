'use client'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export default function OnboardingPage() {
  const router = useRouter()

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-primary mb-1">Still</h1>
        </div>
        <Card className="p-6 space-y-4 text-center">
          <p className="text-[var(--color-text)]">Your account doesn&apos;t have access to a distillery yet.</p>
          <p className="text-sm text-[var(--color-text-muted)]">Contact your administrator to be added.</p>
          <Button variant="secondary" onClick={signOut} className="w-full" size="lg">
            Sign out
          </Button>
        </Card>
      </div>
    </div>
  )
}
