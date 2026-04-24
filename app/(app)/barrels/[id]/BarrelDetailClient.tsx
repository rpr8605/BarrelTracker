'use client'
import { useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, TagChip } from '@/components/ui/Badge'
import { AgeBar } from '@/components/barrels/AgeBar'
import { VoiceRecorder } from '@/components/voice/VoiceRecorder'
import { NoteTimeline } from '@/components/voice/NoteTimeline'
import { createClient } from '@/lib/supabase'
import { formatDate, formatMonths } from '@/lib/utils'
import { getBarrelAgeMonths, estimateAngelsShare } from '@/lib/tags'
import { isNFCSupported, writeNFCTag } from '@/lib/nfc'
import type { Barrel, VoiceNote } from '@/types/database'

export function BarrelDetailClient({ barrel: initial, notes: initialNotes }: { barrel: Barrel; notes: VoiceNote[] }) {
  const [barrel, setBarrel] = useState(initial)
  const [notes, setNotes] = useState(initialNotes)
  const [editing, setEditing] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)
  const [nfcWriting, setNfcWriting] = useState(false)
  const [nfcMsg, setNfcMsg] = useState('')

  const ageMonths = getBarrelAgeMonths(barrel.entry_date)
  const angelsShare = estimateAngelsShare(ageMonths, barrel.warehouse_tier)

  async function markReady() {
    const supabase = createClient()
    await supabase.from('barrels').update({ status: 'ready' }).eq('id', barrel.id)
    setBarrel((b) => ({ ...b, status: 'ready' }))
  }

  async function onNoteComplete(noteId: string) {
    const supabase = createClient()
    const { data } = await supabase.from('voice_notes').select('*').eq('id', noteId).single()
    if (data) setNotes((n) => [data as VoiceNote, ...n])
    setShowRecorder(false)
  }

  async function linkNFC() {
    if (!isNFCSupported()) { setNfcMsg('NFC not supported on this device'); return }
    setNfcWriting(true)
    setNfcMsg('')
    try {
      await writeNFCTag(barrel.id, barrel.barrel_number)
      const supabase = createClient()
      await supabase.from('barrels').update({ nfc_tag_id: `nfc-${barrel.id}` }).eq('id', barrel.id)
      setBarrel((b) => ({ ...b, nfc_tag_id: `nfc-${b.id}` }))
      setNfcMsg('NFC tag linked!')
    } catch (e: unknown) {
      setNfcMsg(e instanceof Error ? e.message : 'Failed to write NFC tag')
    } finally {
      setNfcWriting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <Link href="/barrels" className="hover:text-[var(--color-text)]">Barrels</Link>
        <span>›</span>
        <span className="text-[var(--color-text)]">{barrel.barrel_number}</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left column */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-xl font-medium text-[var(--color-text)]">{barrel.barrel_number}</h1>
                <StatusBadge status={barrel.status} />
              </div>
              <Button variant="secondary" size="sm" onClick={() => setEditing(!editing)}>
                {editing ? 'Done' : 'Edit'}
              </Button>
            </div>

            <div className="space-y-3">
              <AgeBar entryDate={barrel.entry_date} predictedPeakDate={barrel.predicted_peak_date} />

              <div className="grid grid-cols-2 gap-3 text-sm">
                {[
                  ['Age', formatMonths(ageMonths)],
                  ['Entry date', formatDate(barrel.entry_date)],
                  ['Mash bill', barrel.mash_bill],
                  ['Source', barrel.distillery_source],
                  ['Entry proof', barrel.entry_proof ? `${barrel.entry_proof}°` : null],
                  ['Finish', barrel.finish_type || 'None'],
                  ['Location', barrel.warehouse_row ? `Row ${barrel.warehouse_row} / Slot ${barrel.warehouse_slot} / Tier ${barrel.warehouse_tier}` : null],
                  ['Angel\'s share', `~${angelsShare.toFixed(1)}%`],
                ].map(([label, value]) => value ? (
                  <div key={label as string}>
                    <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
                    <div className="text-[var(--color-text)] mt-0.5">{value}</div>
                  </div>
                ) : null)}
              </div>

              {barrel.tags && barrel.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2 border-t border-[var(--color-border)]">
                  {barrel.tags.map((tag) => <TagChip key={tag} tag={tag} amber />)}
                </div>
              )}
            </div>
          </Card>

          <Card>
            <h3 className="text-sm font-medium mb-3">Quick actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {barrel.status !== 'ready' && (
                <Button variant="secondary" size="sm" onClick={markReady}>Mark ready</Button>
              )}
              <Link href={`/blend?barrel=${barrel.id}`}>
                <Button variant="secondary" size="sm" className="w-full">Add to blend</Button>
              </Link>
              <Link href={`/barrels/${barrel.id}/story`}>
                <Button variant="secondary" size="sm" className="w-full">Generate story</Button>
              </Link>
              <Button variant="secondary" size="sm" onClick={linkNFC} loading={nfcWriting}>
                {barrel.nfc_tag_id ? 'NFC linked ◈' : 'Link NFC tag'}
              </Button>
            </div>
            {nfcMsg && <p className="text-xs mt-2 text-center text-[var(--color-text-muted)]">{nfcMsg}</p>}
          </Card>

          {barrel.photos && barrel.photos.length > 0 && (
            <Card>
              <h3 className="text-sm font-medium mb-3">Photo timeline</h3>
              <div className="grid grid-cols-3 gap-2">
                {barrel.photos.map((url, i) => (
                  <img key={i} src={url} alt={`Barrel photo ${i + 1}`} className="w-full aspect-square object-cover rounded-lg" />
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Voice notes</h3>
              <Button size="sm" variant="secondary" onClick={() => setShowRecorder(!showRecorder)}>
                {showRecorder ? 'Cancel' : '+ Add note'}
              </Button>
            </div>
            {showRecorder && (
              <div className="mb-4 pb-4 border-b border-[var(--color-border)]">
                <VoiceRecorder barrelId={barrel.id} distilleryId={barrel.distillery_id} onComplete={onNoteComplete} />
              </div>
            )}
            <NoteTimeline notes={notes} />
          </Card>

          <Card>
            <h3 className="text-sm font-medium mb-2">AI tasting prediction</h3>
            {notes.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">Record voice notes to unlock AI flavor predictions</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Based on {notes.length} note{notes.length !== 1 ? 's' : ''}, this barrel shows strong potential.
                  {barrel.predicted_peak_date && ` Predicted peak: ${formatDate(barrel.predicted_peak_date)}.`}
                </p>
                {barrel.profile_match_score != null && (
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 rounded-full bg-[var(--color-border)] overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${barrel.profile_match_score}%` }} />
                    </div>
                    <span className="text-sm text-primary font-medium">{barrel.profile_match_score}% match</span>
                  </div>
                )}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
