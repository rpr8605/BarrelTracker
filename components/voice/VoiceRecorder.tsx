'use client'
import { useState, useRef } from 'react'
import { Button } from '@/components/ui/Button'

interface VoiceRecorderProps {
  barrelId: string
  distilleryId: string
  onComplete: (noteId: string) => void
}

export function VoiceRecorder({ barrelId, distilleryId, onComplete }: VoiceRecorderProps) {
  const [state, setState] = useState<'idle' | 'recording' | 'uploading'>('idle')
  const [seconds, setSeconds] = useState(0)
  const [error, setError] = useState('')
  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  async function startRecording() {
    setError('')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        upload()
      }

      mediaRef.current = recorder
      recorder.start(1000)
      setState('recording')
      setSeconds(0)
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000)
    } catch {
      setError('Microphone access denied. Check your browser settings.')
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current)
    mediaRef.current?.stop()
    setState('uploading')
  }

  async function upload() {
    const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
    const formData = new FormData()
    formData.append('audio', blob, 'note.webm')
    formData.append('barrelId', barrelId)
    formData.append('distilleryId', distilleryId)
    formData.append('duration', String(seconds))

    try {
      const res = await fetch('/api/voice-notes', { method: 'POST', body: formData })
      const data = await res.json()
      if (data.id) {
        onComplete(data.id)
        setState('idle')
        setSeconds(0)
      } else {
        throw new Error(data.error || 'Upload failed')
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
      setState('idle')
    }
  }

  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="space-y-3">
      {state === 'idle' && (
        <Button onClick={startRecording} className="w-full gap-3" size="lg">
          <span className="w-3 h-3 rounded-full bg-white" />
          Record Voice Note
        </Button>
      )}

      {state === 'recording' && (
        <div className="flex flex-col items-center gap-3 py-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-danger/10 flex items-center justify-center">
              <div className="w-10 h-10 rounded-full bg-danger animate-pulse" />
            </div>
          </div>
          <span className="text-lg font-medium tabular-nums">{fmt(seconds)}</span>
          <Button onClick={stopRecording} variant="secondary" size="sm">Stop Recording</Button>
        </div>
      )}

      {state === 'uploading' && (
        <div className="text-center py-4 text-[var(--color-text-muted)] text-sm">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Transcribing and extracting flavors...
        </div>
      )}

      {error && <p className="text-sm text-danger text-center">{error} <button onClick={() => setError('')} className="underline ml-1">Dismiss</button></p>}
    </div>
  )
}
