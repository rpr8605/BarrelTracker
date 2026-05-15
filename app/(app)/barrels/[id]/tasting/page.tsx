'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { TastingForm } from '@/components/tasting/TastingForm'
import { FlavorRadarChart } from '@/components/tasting/FlavorRadarChart'
import { scoreCategory } from '@/lib/tasting-descriptors'

type Session = {
  id: string
  sampled_at: string
  overall_score: number | null
  abv_at_sample: number | null
  color_description: string | null
  voice_note_transcript: string | null
  tasting_notes: { category: string; descriptors: string[] }[]
}

export default function BarrelTastingPage() {
  const params = useParams<{ id: string }>()
  const id = params.id
  const [sessions, setSessions] = useState<Session[]>([])
  const [radar, setRadar] = useState<[string, number][]>([])
  const [showForm, setShowForm] = useState(false)

  async function load() {
    const a = await fetch(`/api/tasting/barrel/${id}`).then((r) => r.json())
    setSessions(a.sessions || [])
    const b = await fetch(`/api/tasting/flavor-profile/${id}`).then((r) => r.json())
    setRadar(b.top_descriptors || [])
  }
  useEffect(() => { load() }, [id])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-medium">Tasting Log</h1>
        <Button onClick={() => setShowForm(!showForm)}>{showForm ? 'Cancel' : '+ Add tasting note'}</Button>
      </div>

      {showForm && (
        <Card>
          <TastingForm barrelId={id} onSaved={() => { setShowForm(false); load() }} />
        </Card>
      )}

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="text-sm font-medium mb-2">Flavor profile</div>
          <FlavorRadarChart descriptors={radar} />
          <div className="text-xs text-[var(--color-text-muted)] text-center">{sessions.length} session{sessions.length === 1 ? '' : 's'}</div>
        </Card>
        <Card>
          <div className="text-sm font-medium mb-3">Recent sessions</div>
          <div className="space-y-3">
            {sessions.slice(0, 5).map((s) => (
              <div key={s.id} className="border-l-2 border-primary pl-3">
                <div className="flex items-baseline gap-3">
                  <div className="text-sm font-medium">{new Date(s.sampled_at).toLocaleDateString()}</div>
                  {s.overall_score != null && (
                    <span className="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary">{s.overall_score} · {scoreCategory(s.overall_score)}</span>
                  )}
                </div>
                <div className="text-xs text-[var(--color-text-muted)] mt-1 space-x-2">
                  {s.tasting_notes.map((n) => (
                    <span key={n.category}><b className="text-[var(--color-text)]">{n.category}:</b> {n.descriptors.join(', ') || '—'}</span>
                  ))}
                </div>
              </div>
            ))}
            {sessions.length === 0 && <div className="text-sm text-[var(--color-text-muted)]">No tasting notes yet.</div>}
          </div>
        </Card>
      </div>
    </div>
  )
}
