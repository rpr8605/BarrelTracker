'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase'

interface GeoLocationProps {
  barrelId: string
  latitude: number | null
  longitude: number | null
  accuracy: number | null
  capturedAt: string | null
  label: string | null
  onUpdate: (data: { latitude: number; longitude: number; accuracy: number; label: string }) => void
}

export function GeoLocation({ barrelId, latitude, longitude, accuracy, capturedAt, label, onUpdate }: GeoLocationProps) {
  const [capturing, setCapturing] = useState(false)
  const [error, setError] = useState('')
  const [editLabel, setEditLabel] = useState(label || '')

  async function capture() {
    if (!navigator.geolocation) { setError('Geolocation not supported on this device'); return }
    setCapturing(true)
    setError('')

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng, accuracy: acc } = pos.coords
        const supabase = createClient()
        await supabase.from('barrels').update({
          latitude: lat,
          longitude: lng,
          location_accuracy_m: acc,
          location_captured_at: new Date().toISOString(),
          location_label: editLabel || null,
        }).eq('id', barrelId)

        onUpdate({ latitude: lat, longitude: lng, accuracy: acc, label: editLabel })
        setCapturing(false)
      },
      (err) => {
        setError(err.message || 'Could not get location')
        setCapturing(false)
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    )
  }

  async function saveLabel() {
    const supabase = createClient()
    await supabase.from('barrels').update({ location_label: editLabel || null }).eq('id', barrelId)
  }

  const mapsUrl = latitude && longitude
    ? `https://maps.google.com/maps?q=${latitude},${longitude}&z=20`
    : null

  const accuracy_ft = accuracy ? Math.round(accuracy * 3.281) : null

  return (
    <div className="space-y-3">
      {latitude && longitude ? (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>
              <div className="text-xs text-[var(--color-text-muted)]">Latitude</div>
              <div className="font-mono text-[var(--color-text)]">{latitude.toFixed(6)}°</div>
            </div>
            <div>
              <div className="text-xs text-[var(--color-text-muted)]">Longitude</div>
              <div className="font-mono text-[var(--color-text)]">{longitude.toFixed(6)}°</div>
            </div>
            {accuracy_ft && (
              <div>
                <div className="text-xs text-[var(--color-text-muted)]">Accuracy</div>
                <div className="text-[var(--color-text)]">±{accuracy_ft} ft</div>
              </div>
            )}
            {capturedAt && (
              <div>
                <div className="text-xs text-[var(--color-text-muted)]">Captured</div>
                <div className="text-[var(--color-text)]">{new Date(capturedAt).toLocaleDateString()}</div>
              </div>
            )}
          </div>

          <div className="flex gap-2">
            <input
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              onBlur={saveLabel}
              placeholder="Location label (e.g. Rickhouse A, Bay 3)"
              className="flex-1 px-2.5 py-1.5 text-sm rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text)] outline-none focus:border-primary min-h-[36px]"
            />
          </div>

          {mapsUrl && (
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline min-h-[32px]"
            >
              Open in Maps →
            </a>
          )}
        </div>
      ) : (
        <p className="text-sm text-[var(--color-text-muted)]">No location captured yet.</p>
      )}

      <Button
        variant="secondary"
        size="sm"
        onClick={capture}
        loading={capturing}
        className="w-full"
      >
        {latitude ? 'Update location' : 'Capture location now'}
      </Button>

      {error && <p className="text-xs text-danger">{error}</p>}

      <p className="text-xs text-[var(--color-text-muted)]">
        Uses your device GPS — works best outdoors or near a window. Accuracy improves with High Accuracy mode enabled on your phone.
      </p>
    </div>
  )
}
