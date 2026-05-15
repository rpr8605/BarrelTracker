'use client'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { TASTING_DESCRIPTORS, scoreCategory } from '@/lib/tasting-descriptors'

interface Props {
  barrelId: string
  onSaved?: () => void
}

export function TastingForm({ barrelId, onSaved }: Props) {
  const [nose, setNose] = useState<string[]>([])
  const [palate, setPalate] = useState<string[]>([])
  const [finish, setFinish] = useState<string[]>([])
  const [score, setScore] = useState(75)
  const [abv, setAbv] = useState('')
  const [color, setColor] = useState('')
  const [transcript, setTranscript] = useState('')
  const [recording, setRecording] = useState(false)
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function submit() {
    setSaving(true); setErr(null)
    try {
      const res = await fetch('/api/tasting', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          barrel_id: barrelId,
          nose, palate, finish,
          overall_score: score,
          abv_at_sample: abv ? Number(abv) : undefined,
          color_description: color || undefined,
          voice_note_transcript: transcript || undefined,
        }),
      })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      setNose([]); setPalate([]); setFinish([]); setScore(75); setAbv(''); setColor(''); setTranscript('')
      onSaved?.()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  async function recordVoiceNote() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setErr('Speech recognition unavailable — type notes manually')
      return
    }
    setRecording(true)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const rec = new SR()
    rec.continuous = true
    rec.interimResults = false
    rec.lang = 'en-US'
    let text = ''
    rec.onresult = (e: { results: { isFinal: boolean; 0: { transcript: string } }[] }) => {
      for (let i = 0; i < e.results.length; i++) if (e.results[i].isFinal) text += e.results[i][0].transcript + ' '
      setTranscript(text)
    }
    rec.onend = () => setRecording(false)
    rec.onerror = () => setRecording(false)
    rec.start()
    setTimeout(() => { try { rec.stop() } catch {} }, 30000)
  }

  return (
    <div className="space-y-4">
      {err && <div className="text-sm text-danger">{err}</div>}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Voice note (auto-extracts descriptors)</label>
          <Button size="sm" variant={recording ? 'danger' : 'secondary'} onClick={recordVoiceNote}>
            {recording ? '● Listening…' : '🎤 Record'}
          </Button>
        </div>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Or type your tasting notes…"
          className="w-full p-3 rounded-lg border border-[var(--color-border)] text-sm min-h-[80px] bg-[var(--color-surface)]"
        />
      </div>

      <DescriptorPicker label="Nose"   selected={nose}   onChange={setNose} />
      <DescriptorPicker label="Palate" selected={palate} onChange={setPalate} />
      <DescriptorPicker label="Finish" selected={finish} onChange={setFinish} />

      <div>
        <label className="text-sm font-medium block mb-1">Overall score: <span className="text-primary">{score}</span> <span className="text-xs text-[var(--color-text-muted)] ml-2">{scoreCategory(score)}</span></label>
        <input type="range" min={0} max={100} value={score} onChange={(e) => setScore(Number(e.target.value))} className="w-full accent-primary" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Input label="ABV at sample" type="number" step="0.1" value={abv} onChange={(e) => setAbv(e.target.value)} />
        <Input label="Color" placeholder="deep amber" value={color} onChange={(e) => setColor(e.target.value)} />
      </div>

      <Button onClick={submit} loading={saving} className="w-full">Save tasting note</Button>
    </div>
  )
}

function DescriptorPicker({ label, selected, onChange }: { label: string; selected: string[]; onChange: (v: string[]) => void }) {
  const [input, setInput] = useState('')
  const suggestions = TASTING_DESCRIPTORS.filter((d) => d.toLowerCase().includes(input.toLowerCase()) && !selected.includes(d)).slice(0, 6)

  function add(d: string) {
    onChange([...selected, d])
    setInput('')
  }

  return (
    <div>
      <label className="text-sm font-medium block mb-1">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-[32px]">
        {selected.map((d) => (
          <span key={d} className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs bg-primary/10 text-primary">
            {d}
            <button onClick={() => onChange(selected.filter((x) => x !== d))} className="opacity-60 hover:opacity-100">×</button>
          </span>
        ))}
      </div>
      <div className="relative">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && input) { e.preventDefault(); add(input.toLowerCase()); } }}
          placeholder="Type or pick a descriptor"
        />
        {input && suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 z-10 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg max-h-44 overflow-auto">
            {suggestions.map((s) => (
              <button key={s} onClick={() => add(s)} className="block w-full text-left px-3 py-2 text-sm hover:bg-[var(--color-bg-secondary)]">{s}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
