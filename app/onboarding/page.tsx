'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card } from '@/components/ui/Card'

export default function OnboardingPage() {
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  async function save() {
    if (!name.trim()) return
    setSaving(true)
    setError('')
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }

      const { error } = await supabase.from('distilleries').insert({
        name: name.trim(),
        location: location.trim() || null,
        owner_id: user.id,
      })

      if (error) throw new Error(error.message)

      // Create empty taste profile
      await supabase.from('taste_profile').insert({
        user_id: user.id,
        grain_scores: {},
        flavor_scores: {},
        aging_sweet_spot_months: { min: 24, max: 36 },
        total_tastings: 0,
      })

      router.push('/dashboard')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--color-bg)]">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-medium text-primary mb-1">Welcome to Still</h1>
          <p className="text-sm text-[var(--color-text-muted)]">Let's set up your distillery</p>
        </div>

        <Card className="p-6 space-y-4">
          <Input
            label="Distillery name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Russell Creek Distillery"
            autoFocus
          />
          <Input
            label="Location (optional)"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Bardstown, KY"
          />

          {error && <p className="text-sm text-danger">{error}</p>}

          <Button onClick={save} loading={saving} disabled={!name.trim()} className="w-full" size="lg">
            Get started
          </Button>
        </Card>
      </div>
    </div>
  )
}
