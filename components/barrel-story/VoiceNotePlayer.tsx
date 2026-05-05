'use client'
import { useRef, useState, useEffect } from 'react'

interface Props {
  audioUrl: string
  transcript: string | null
  duration: number | null
}

export function VoiceNotePlayer({ audioUrl, transcript, duration }: Props) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [playing, setPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [waveform, setWaveform] = useState<number[]>([])

  useEffect(() => {
    // Generate pseudo-waveform from duration for visual effect
    const bars = 60
    const seeded = Array.from({ length: bars }, (_, i) => {
      const x = i / bars
      return 0.2 + 0.6 * Math.abs(Math.sin(x * 12 + 1.5) * Math.cos(x * 7))
    })
    setWaveform(seeded)
  }, [duration])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTime = () => setProgress(audio.currentTime / (audio.duration || 1))
    const onEnd = () => { setPlaying(false); setProgress(0) }
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnd)
    return () => { audio.removeEventListener('timeupdate', onTime); audio.removeEventListener('ended', onEnd) }
  }, [])

  function togglePlay() {
    const audio = audioRef.current
    if (!audio) return
    if (playing) { audio.pause(); setPlaying(false) }
    else { audio.play(); setPlaying(true) }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const audio = audioRef.current
    if (!audio) return
    const rect = e.currentTarget.getBoundingClientRect()
    const pct = (e.clientX - rect.left) / rect.width
    audio.currentTime = pct * audio.duration
  }

  const fmtDuration = (s: number | null) => {
    if (!s) return '—'
    const m = Math.floor(s / 60)
    const sec = String(Math.floor(s % 60)).padStart(2, '0')
    return `${m}:${sec}`
  }

  return (
    <div className="rounded-2xl border border-white/10 p-5 space-y-4">
      <div className="flex items-center gap-4">
        <button
          onClick={togglePlay}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all flex-shrink-0"
        >
          {playing ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><polygon points="5,3 19,12 5,21"/></svg>
          )}
        </button>

        <div className="flex-1" onClick={seek}>
          <div className="flex gap-px items-end h-10 cursor-pointer">
            {waveform.map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm transition-colors"
                style={{
                  height: `${h * 100}%`,
                  backgroundColor: i / waveform.length <= progress ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)',
                }}
              />
            ))}
          </div>
        </div>

        <span className="text-xs text-gray-500 flex-shrink-0">{fmtDuration(duration)}</span>
      </div>

      {transcript && (
        <p className="text-sm text-gray-400 italic leading-relaxed border-t border-white/10 pt-4">
          &ldquo;{transcript.slice(0, 280)}{transcript.length > 280 ? '...' : ''}&rdquo;
        </p>
      )}

      <audio ref={audioRef} src={audioUrl} preload="metadata" />
    </div>
  )
}
