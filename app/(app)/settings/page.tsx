'use client'
import { useState, useEffect, useRef } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { createClient } from '@/lib/supabase'
import { getMyDistilleryId } from '@/lib/distillery'
import type { Distillery } from '@/types/database'

export default function SettingsPage() {
  const [distillery, setDistillery] = useState<Distillery | null>(null)
  const [name, setName] = useState('')
  const [location, setLocation] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [webhookUrl, setWebhookUrl] = useState('')
  const [webhookSaving, setWebhookSaving] = useState(false)
  const [thresholds, setThresholds] = useState({ tempHigh: 90, tempLow: 40, humidHigh: 75, humidLow: 40 })
  const [widgetCopied, setWidgetCopied] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      getMyDistilleryId(supabase, user.id).then((id) => {
        if (!id) return
        supabase.from('distilleries').select('*').eq('id', id).single().then(({ data }) => {
          if (data) {
            setDistillery(data as Distillery)
            setName(data.name)
            setLocation(data.location || '')
          }
        })
      })
    })
  }, [])

  async function saveDistillery() {
    if (!distillery) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('distilleries').update({ name, location }).eq('id', distillery.id)
    setSaved(true)
    setSaving(false)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="space-y-5 max-w-lg mx-auto">
      <h1 className="font-medium text-lg">Settings</h1>

      <Card className="space-y-4">
        <h2 className="text-sm font-medium">Distillery</h2>
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g. Bardstown, KY" />
        <Button onClick={saveDistillery} loading={saving} size="sm">
          {saved ? 'Saved ✓' : 'Save'}
        </Button>
      </Card>

      <Card className="space-y-4">
        <h2 className="text-sm font-medium">Environmental alerts</h2>
        <p className="text-xs text-[var(--color-text-muted)]">
          Send sensor data to <code className="bg-[var(--color-bg-secondary)] px-1 py-0.5 rounded text-primary">/api/environment/log</code> via POST with <code className="bg-[var(--color-bg-secondary)] px-1 py-0.5 rounded text-primary">{'{ zone, temperature_f, humidity_pct, distillery_id }'}</code>
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Temp high (°F)" type="number" value={thresholds.tempHigh} onChange={(e) => setThresholds(t => ({ ...t, tempHigh: +e.target.value }))} />
          <Input label="Temp low (°F)" type="number" value={thresholds.tempLow} onChange={(e) => setThresholds(t => ({ ...t, tempLow: +e.target.value }))} />
          <Input label="Humidity high (%)" type="number" value={thresholds.humidHigh} onChange={(e) => setThresholds(t => ({ ...t, humidHigh: +e.target.value }))} />
          <Input label="Humidity low (%)" type="number" value={thresholds.humidLow} onChange={(e) => setThresholds(t => ({ ...t, humidLow: +e.target.value }))} />
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">Alerts send to the distillery owner email when thresholds are breached.</p>
      </Card>

      {distillery && (
        <Card className="space-y-4">
          <h2 className="text-sm font-medium">Embed Widget</h2>
          <p className="text-xs text-[var(--color-text-muted)]">
            Drop this iframe on your website to show your available barrels with an Adopt button.
            Supports <code className="bg-[var(--color-bg-secondary)] px-1 py-0.5 rounded text-primary">?theme=light</code> or <code className="bg-[var(--color-bg-secondary)] px-1 py-0.5 rounded text-primary">?theme=dark</code>.
          </p>
          <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 text-xs font-mono text-[var(--color-text-muted)] break-all select-all">
            {`<iframe src="https://barrel-tracker.vercel.app/widget/${distillery.id}" width="100%" height="400" frameborder="0"></iframe>`}
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              navigator.clipboard.writeText(
                `<iframe src="https://barrel-tracker.vercel.app/widget/${distillery.id}" width="100%" height="400" frameborder="0"></iframe>`
              )
              setWidgetCopied(true)
              setTimeout(() => setWidgetCopied(false), 2000)
            }}
          >
            {widgetCopied ? 'Copied ✓' : 'Copy embed code'}
          </Button>
          <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
            <p className="text-xs text-[var(--color-text-muted)] px-3 py-2 border-b border-[var(--color-border)]">Preview</p>
            {/* eslint-disable-next-line @next/next/no-sync-scripts */}
            <iframe
              ref={iframeRef}
              src={`/widget/${distillery.id}?theme=dark`}
              width="100%"
              height="340"
              frameBorder={0}
              title="Barrel Widget Preview"
              className="block"
            />
          </div>
        </Card>
      )}

      <Card className="space-y-3">
        <h2 className="text-sm font-medium">Account</h2>
        <p className="text-xs text-[var(--color-text-muted)]">Add more users by having them create an account at the login page. All users sharing this distillery see the same data.</p>
        <Button
          variant="danger"
          size="sm"
          onClick={async () => {
            const supabase = createClient()
            await supabase.auth.signOut()
            window.location.href = '/login'
          }}
        >
          Sign out
        </Button>
      </Card>
    </div>
  )
}
