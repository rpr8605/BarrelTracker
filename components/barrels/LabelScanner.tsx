'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'

export interface ExtractedLabel {
  barrel_number: string | null
  mash_bill: string | null
  distillery_source: string | null
  entry_date: string | null
  entry_proof: number | null
  notes: string | null
}

export function LabelScanner({ onExtracted }: { onExtracted: (data: ExtractedLabel) => void }) {
  const [scanning, setScanning] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [extracted, setExtracted] = useState<ExtractedLabel | null>(null)
  const [error, setError] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  const FIELD_LABELS: Record<keyof ExtractedLabel, string> = {
    barrel_number: 'Barrel #',
    mash_bill: 'Mash bill',
    distillery_source: 'Source',
    entry_date: 'Entry date',
    entry_proof: 'Entry proof',
    notes: 'Notes',
  }

  async function scan(file: File) {
    setScanning(true)
    setError('')
    setExtracted(null)

    const dataUrl = await new Promise<string>((res) => {
      const reader = new FileReader()
      reader.onload = (e) => res(e.target!.result as string)
      reader.readAsDataURL(file)
    })
    setPreview(dataUrl)

    const base64 = dataUrl.split(',')[1]

    try {
      const resp = await fetch('/api/barrels/scan-label', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType: file.type }),
      })
      const data = await resp.json()
      if (data.extracted) setExtracted(data.extracted)
      else setError(data.error || 'No text found — try a clearer photo')
    } catch {
      setError('Scan failed — check your connection')
    } finally {
      setScanning(false)
    }
  }

  function reset() {
    setExtracted(null)
    setPreview(null)
    setError('')
    if (inputRef.current) inputRef.current.value = ''
    inputRef.current?.click()
  }

  const hasFields = extracted && Object.values(extracted).some((v) => v !== null)

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) scan(f) }}
      />

      {!preview && (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => inputRef.current?.click()}
          loading={scanning}
          className="w-full"
        >
          Scan barrel label
        </Button>
      )}

      {preview && (
        <div className="relative">
          <img src={preview} alt="Scanned" className="w-full max-h-36 object-cover rounded-lg" />
          {scanning && (
            <div className="absolute inset-0 bg-black/40 rounded-lg flex items-center justify-center">
              <span className="text-white text-sm">Reading text...</span>
            </div>
          )}
        </div>
      )}

      {hasFields && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-[var(--color-text-muted)]">Extracted — tap Apply to use</p>
          <div className="bg-[var(--color-bg-secondary)] rounded-lg p-3 space-y-1.5">
            {(Object.entries(extracted!) as [keyof ExtractedLabel, string | number | null][])
              .filter(([, v]) => v !== null)
              .map(([k, v]) => (
                <div key={k} className="flex gap-2 text-sm">
                  <span className="text-[var(--color-text-muted)] w-24 shrink-0">{FIELD_LABELS[k]}</span>
                  <span className="text-[var(--color-text)]">{String(v)}</span>
                </div>
              ))}
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onExtracted(extracted!)} className="flex-1">
              Apply to barrel
            </Button>
            <Button size="sm" variant="secondary" onClick={reset}>
              Rescan
            </Button>
          </div>
        </div>
      )}

      {!hasFields && extracted && (
        <div className="space-y-2">
          <p className="text-xs text-[var(--color-text-muted)]">No barrel info found in image</p>
          <Button size="sm" variant="secondary" onClick={reset} className="w-full">Rescan</Button>
        </div>
      )}

      {error && (
        <div className="space-y-2">
          <p className="text-xs text-danger">{error}</p>
          <Button size="sm" variant="secondary" onClick={reset} className="w-full">Try again</Button>
        </div>
      )}
    </div>
  )
}
