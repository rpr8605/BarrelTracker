'use client'
import { TagChip } from '@/components/ui/Badge'
import { formatDate } from '@/lib/utils'
import type { VoiceNote } from '@/types/database'

export function NoteTimeline({ notes }: { notes: VoiceNote[] }) {
  if (!notes.length) {
    return (
      <div className="text-center py-6 text-[var(--color-text-muted)] text-sm">
        No voice notes yet. Record your first tasting note.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <div key={note.id} className="card p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[var(--color-text-muted)]">{formatDate(note.recorded_at)}</span>
            {note.duration_seconds && (
              <span className="text-xs text-[var(--color-text-muted)]">
                {Math.floor(note.duration_seconds / 60)}:{String(note.duration_seconds % 60).padStart(2, '0')}
              </span>
            )}
          </div>

          {note.audio_url && (
            <audio controls src={note.audio_url} className="w-full h-8" preload="none" />
          )}

          {note.transcript && (
            <p className="text-sm text-[var(--color-text)] leading-relaxed">{note.transcript}</p>
          )}

          {note.ai_extracted_tags && note.ai_extracted_tags.length > 0 && (
            <div className="flex flex-wrap gap-1 pt-1">
              {note.ai_extracted_tags.map((tag) => (
                <TagChip key={tag} tag={tag} amber />
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
