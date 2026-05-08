'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { StatusBadge, TagChip } from '@/components/ui/Badge'
import { AgeBar } from '@/components/barrels/AgeBar'
import { BarrelEditForm } from '@/components/barrels/BarrelEditForm'
import { PhotoTimeline } from '@/components/barrels/PhotoTimeline'
import { LabelScanner } from '@/components/barrels/LabelScanner'
import { BarrelQRCode } from '@/components/barrels/QRCode'
import { VoiceRecorder } from '@/components/voice/VoiceRecorder'
import { NoteTimeline } from '@/components/voice/NoteTimeline'
import { createClient } from '@/lib/supabase'
import { formatDate, formatMonths } from '@/lib/utils'
import { getBarrelAgeMonths, estimateAngelsShare } from '@/lib/tags'
import { isNFCSupported, writeNFCTag } from '@/lib/nfc'
import { calculateBarrelAge } from '@/lib/ttb/age-calculator'
import { GeoLocation } from '@/components/barrels/GeoLocation'
import { useCanWrite } from '@/lib/role-context'
import { TTB_EVENT_LABELS, formatWineGal, formatProofGal, calcProofGallons } from '@/lib/ttb'
import type { Barrel, VoiceNote, BarrelEvent } from '@/types/database'
import type { ExtractedLabel } from '@/components/barrels/LabelScanner'

const EVENT_TYPES = ['fill','transfer_in','transfer_out','gain','loss','bottling','dump'] as const

export function BarrelDetailClient({ barrel: initial, notes: initialNotes }: { barrel: Barrel; notes: VoiceNote[] }) {
  const [barrel, setBarrel] = useState(initial)
  const [notes, setNotes] = useState(initialNotes)
  const [editing, setEditing] = useState(false)
  const [showRecorder, setShowRecorder] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [showQR, setShowQR] = useState(false)
  const [nfcWriting, setNfcWriting] = useState(false)
  const [nfcMsg, setNfcMsg] = useState('')
  const [events, setEvents] = useState<BarrelEvent[]>([])
  const [showEventForm, setShowEventForm] = useState(false)
  const [eventSaving, setEventSaving] = useState(false)
  const [tibRecords, setTibRecords] = useState<Array<{ id: string; serial_number: string; direction: string; counterparty_name: string; counterparty_dsp_number: string; spirits_type: string; wine_gallons: number; proof: number; proof_gallons: number; transfer_date: string; status: string }>>([])
  const [tibLoading, setTibLoading] = useState(false)
  const [eventForm, setEventForm] = useState({
    event_type: 'loss' as typeof EVENT_TYPES[number],
    wine_gallons: '',
    proof: '',
    notes: '',
    occurred_at: new Date().toISOString().slice(0, 16),
  })
  const canWrite = useCanWrite()

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`voice-notes-${barrel.id}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'voice_notes',
        filter: `barrel_id=eq.${barrel.id}`,
      }, (payload) => {
        setNotes((n) => {
          const exists = n.some((note) => note.id === payload.new.id)
          return exists ? n : [payload.new as VoiceNote, ...n]
        })
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [barrel.id])

  // Load barrel events
  useEffect(() => {
    fetch(`/api/compliance/events?barrel_id=${barrel.id}`)
      .then((r) => r.json())
      .then((d) => setEvents(Array.isArray(d) ? d : []))
      .catch(() => {})
  }, [barrel.id])

  // Load TIB records for this barrel
  useEffect(() => {
    if (!barrel.distillery_id) return
    setTibLoading(true)
    fetch(`/api/tib?distillery_id=${barrel.distillery_id}&barrel_id=${barrel.id}`)
      .then((r) => r.json())
      .then((d) => setTibRecords(Array.isArray(d) ? d : []))
      .catch(() => {})
      .finally(() => setTibLoading(false))
  }, [barrel.id, barrel.distillery_id])

  const ageMonths = getBarrelAgeMonths(barrel.entry_date)
  const angelsShare = estimateAngelsShare(ageMonths, barrel.warehouse_tier)
  const barrelAge = barrel.entry_date ? calculateBarrelAge(barrel.entry_date) : null

  async function markReady() {
    const supabase = createClient()
    await supabase.from('barrels').update({ status: 'ready' }).eq('id', barrel.id)
    setBarrel((b) => ({ ...b, status: 'ready' as const }))
  }

  async function onNoteComplete(noteId: string) {
    const supabase = createClient()
    const { data } = await supabase.from('voice_notes').select('*').eq('id', noteId).single()
    if (data) setNotes((n) => {
      const exists = n.some((note) => note.id === data.id)
      return exists ? n : [data as VoiceNote, ...n]
    })
    setShowRecorder(false)
  }

  async function applyLabel(data: ExtractedLabel) {
    const supabase = createClient()
    const updates: Partial<Barrel> = {}
    if (data.barrel_number) updates.barrel_number = data.barrel_number
    if (data.mash_bill) updates.mash_bill = data.mash_bill
    if (data.distillery_source) updates.distillery_source = data.distillery_source
    if (data.entry_date) updates.entry_date = data.entry_date
    if (data.entry_proof) updates.entry_proof = Number(data.entry_proof)
    if (data.notes) updates.notes = data.notes
    await supabase.from('barrels').update(updates).eq('id', barrel.id)
    setBarrel((b) => ({ ...b, ...updates }))
    setShowScanner(false)
  }

  async function linkNFC() {
    if (!isNFCSupported()) { setNfcMsg('NFC not supported on this device — use the QR code instead'); return }
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

  async function saveEvent() {
    if (!eventForm.wine_gallons) return
    setEventSaving(true)
    const res = await fetch('/api/compliance/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        barrel_id: barrel.id,
        distillery_id: barrel.distillery_id,
        event_type: eventForm.event_type,
        wine_gallons: parseFloat(eventForm.wine_gallons),
        proof: eventForm.proof ? parseFloat(eventForm.proof) : null,
        notes: eventForm.notes || null,
        occurred_at: new Date(eventForm.occurred_at).toISOString(),
      }),
    })
    const ev = await res.json()
    if (ev.id) {
      setEvents((prev) => [ev, ...prev])
      // Update local barrel volume estimate
      const wg = parseFloat(eventForm.wine_gallons)
      const pf = eventForm.proof ? parseFloat(eventForm.proof) : null
      const pg = pf ? calcProofGallons(wg, pf) : null
      const sign = ['fill', 'transfer_in', 'gain'].includes(eventForm.event_type) ? 1 : -1
      setBarrel((b) => ({
        ...b,
        current_wine_gallons: Math.max(0, (b.current_wine_gallons ?? b.wine_gallons ?? 0) + wg * sign),
      }))
      setShowEventForm(false)
      setEventForm({ event_type: 'loss', wine_gallons: '', proof: '', notes: '', occurred_at: new Date().toISOString().slice(0, 16) })
    }
    setEventSaving(false)
  }

  const currentWG = barrel.current_wine_gallons ?? barrel.wine_gallons
  const currentPG = currentWG != null && barrel.entry_proof != null
    ? calcProofGallons(currentWG, barrel.entry_proof)
    : null

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
                <div className="mt-1"><StatusBadge status={barrel.status} /></div>
              </div>
              {canWrite && (
                <Button variant="secondary" size="sm" onClick={() => setEditing(!editing)}>
                  {editing ? 'Done editing' : 'Edit'}
                </Button>
              )}
            </div>

            {editing ? (
              <BarrelEditForm
                barrel={barrel}
                onSave={(updated) => { setBarrel(updated); setEditing(false) }}
              />
            ) : (
              <div className="space-y-3">
                <AgeBar entryDate={barrel.entry_date} predictedPeakDate={barrel.predicted_peak_date} />

                <div className="grid grid-cols-2 gap-3 text-sm">
                  {([
                    ['Age', formatMonths(ageMonths)],
                    ['Entry date', formatDate(barrel.entry_date)],
                    ['Mash bill', barrel.mash_bill],
                    ['Source', barrel.distillery_source],
                    ['Entry proof', barrel.entry_proof ? `${barrel.entry_proof}°` : null],
                    ['Current proof', barrel.current_proof_estimate ? `${barrel.current_proof_estimate}°` : null],
                    ['Finish', barrel.finish_type && barrel.finish_type !== 'none' ? barrel.finish_type : null],
                    ['Location', barrel.warehouse_row ? `Row ${barrel.warehouse_row} · Slot ${barrel.warehouse_slot} · Tier ${barrel.warehouse_tier}` : null],
                    ["Angel's share", `~${angelsShare.toFixed(1)}%`],
                    ['Notes', barrel.notes],
                  ] as [string, string | null][]).map(([label, value]) => value ? (
                    <div key={label} className={label === 'Notes' ? 'col-span-2' : ''}>
                      <div className="text-xs text-[var(--color-text-muted)]">{label}</div>
                      <div className="text-[var(--color-text)] mt-0.5 text-sm">{value}</div>
                    </div>
                  ) : null)}
                </div>

                {barrelAge && (barrelAge.mandatory_age_disclosure || barrelAge.under_2_years) && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--color-border)]">
                    {barrelAge.mandatory_age_disclosure && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">Age statement required</span>
                    )}
                    {barrelAge.under_2_years && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400">Cannot use &apos;Straight&apos; designation</span>
                    )}
                  </div>
                )}

                {barrel.tags && barrel.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-2 border-t border-[var(--color-border)]">
                    {barrel.tags.map((tag) => <TagChip key={tag} tag={tag} amber />)}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <Card>
            <h3 className="text-sm font-medium mb-3">Quick actions</h3>
            <div className="grid grid-cols-2 gap-2">
              {canWrite && barrel.status !== 'ready' && (
                <Button variant="secondary" size="sm" onClick={markReady}>Mark ready</Button>
              )}
              {canWrite && (
                <Link href={`/blend?barrel=${barrel.id}`} className="block">
                  <Button variant="secondary" size="sm" className="w-full">Add to blend</Button>
                </Link>
              )}
              {canWrite && (
                <Button variant="secondary" size="sm" onClick={linkNFC} loading={nfcWriting}>
                  {barrel.nfc_tag_id ? 'NFC linked ◈' : 'Link NFC tag'}
                </Button>
              )}
              <Button variant="secondary" size="sm" onClick={() => setShowQR(!showQR)}>
                {showQR ? 'Hide QR' : 'Show QR code'}
              </Button>
              {canWrite && (
                <Button variant="secondary" size="sm" onClick={() => setShowScanner(!showScanner)} className="col-span-2">
                  {showScanner ? 'Cancel scan' : 'Scan barrel label'}
                </Button>
              )}
            </div>
            {nfcMsg && <p className="text-xs mt-2 text-center text-[var(--color-text-muted)]">{nfcMsg}</p>}

            {showScanner && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                <LabelScanner onExtracted={applyLabel} />
              </div>
            )}

            {showQR && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)] flex justify-center">
                <BarrelQRCode barrelId={barrel.id} barrelNumber={barrel.barrel_number} />
              </div>
            )}
          </Card>

          {/* Geolocation */}
          <Card>
            <h3 className="text-sm font-medium mb-3">Location</h3>
            <GeoLocation
              barrelId={barrel.id}
              latitude={barrel.latitude}
              longitude={barrel.longitude}
              accuracy={barrel.location_accuracy_m}
              capturedAt={barrel.location_captured_at}
              label={barrel.location_label}
              onUpdate={(data) => setBarrel((b) => ({
                ...b,
                latitude: data.latitude,
                longitude: data.longitude,
                location_accuracy_m: data.accuracy,
                location_captured_at: new Date().toISOString(),
                location_label: data.label,
              }))}
            />
          </Card>

          {/* Photo timeline */}
          <Card>
            <h3 className="text-sm font-medium mb-3">Photos</h3>
            <PhotoTimeline barrelId={barrel.id} photos={barrel.photos || []} />
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium">Voice notes</h3>
              {canWrite && (
                <Button size="sm" variant="secondary" onClick={() => setShowRecorder(!showRecorder)}>
                  {showRecorder ? 'Cancel' : '+ Add note'}
                </Button>
              )}
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
              <p className="text-sm text-[var(--color-text-muted)]">Record voice notes to unlock AI flavor predictions for this barrel.</p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  Based on {notes.length} note{notes.length !== 1 ? 's' : ''}, this barrel shows strong potential.
                  {barrel.predicted_peak_date && ` Predicted peak: ${formatDate(barrel.predicted_peak_date)}.`}
                </p>
                {(barrel.profile_match_score ?? 0) > 0 && (
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

          {/* TIB Transfer History */}
          {(tibRecords.length > 0 || tibLoading) && (
            <Card>
              <h3 className="text-sm font-medium mb-3">TIB Transfer History</h3>
              {tibLoading && <p className="text-xs text-[var(--color-text-muted)]">Loading transfers…</p>}
              {tibRecords.length === 0 && !tibLoading && <p className="text-xs text-[var(--color-text-muted)]">No TIB transfers on record for this barrel.</p>}
              <div className="space-y-2">
                {tibRecords.map((tib) => (
                  <div key={tib.id} className="text-xs py-1.5 border-b border-[var(--color-border)] last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium font-mono text-[var(--color-text)]">{tib.serial_number}</span>
                      <span className={`px-1.5 py-0.5 rounded ${tib.direction === 'inbound' ? 'bg-green-500/10 text-green-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {tib.direction}
                      </span>
                    </div>
                    <div className="text-[var(--color-text-muted)] mt-0.5">
                      {tib.direction === 'inbound' ? 'From' : 'To'}: {tib.counterparty_name} ({tib.counterparty_dsp_number})
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 font-mono text-[var(--color-text-muted)]">
                      <span>{tib.wine_gallons} WG</span>
                      <span>{tib.proof}°</span>
                      <span>{tib.proof_gallons} PG</span>
                      <span>{formatDate(tib.transfer_date)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* TTB Event Log */}
          <Card>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium">Volume / TTB ledger</h3>
                {(currentWG != null || currentPG != null) && (
                  <div className="flex gap-3 mt-1">
                    {currentWG != null && <span className="text-xs font-mono text-[var(--color-text-muted)]">{formatWineGal(currentWG)}</span>}
                    {currentPG != null && <span className="text-xs font-mono text-[var(--color-text-muted)]">{formatProofGal(currentPG)}</span>}
                  </div>
                )}
              </div>
              {canWrite && (
                <Button size="sm" variant="secondary" onClick={() => setShowEventForm(!showEventForm)}>
                  {showEventForm ? 'Cancel' : '+ Log event'}
                </Button>
              )}
            </div>

            {showEventForm && (
              <div className="mb-4 pb-4 border-b border-[var(--color-border)] space-y-3">
                <Select
                  label="Event type"
                  value={eventForm.event_type}
                  onChange={(e) => setEventForm((f) => ({ ...f, event_type: e.target.value as typeof EVENT_TYPES[number] }))}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>{TTB_EVENT_LABELS[t]}</option>
                  ))}
                </Select>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Wine gallons"
                    type="number"
                    placeholder="e.g. 2.5"
                    value={eventForm.wine_gallons}
                    onChange={(e) => setEventForm((f) => ({ ...f, wine_gallons: e.target.value }))}
                  />
                  <Input
                    label="Proof (optional)"
                    type="number"
                    placeholder={barrel.entry_proof ? String(barrel.entry_proof) : 'e.g. 125'}
                    value={eventForm.proof}
                    onChange={(e) => setEventForm((f) => ({ ...f, proof: e.target.value }))}
                  />
                </div>
                <Input
                  label="Date & time"
                  type="datetime-local"
                  value={eventForm.occurred_at}
                  onChange={(e) => setEventForm((f) => ({ ...f, occurred_at: e.target.value }))}
                />
                <Input
                  label="Notes (optional)"
                  placeholder="Reason for change, inspector name, etc."
                  value={eventForm.notes}
                  onChange={(e) => setEventForm((f) => ({ ...f, notes: e.target.value }))}
                />
                <Button size="sm" onClick={saveEvent} loading={eventSaving} disabled={!eventForm.wine_gallons} className="w-full">
                  Save event
                </Button>
              </div>
            )}

            {events.length === 0 ? (
              <p className="text-sm text-[var(--color-text-muted)]">No events logged yet.</p>
            ) : (
              <div className="space-y-2">
                {events.map((ev) => {
                  const isPositive = ['fill', 'transfer_in', 'gain'].includes(ev.event_type)
                  return (
                    <div key={ev.id} className="flex items-start justify-between gap-2 text-xs py-1.5 border-b border-[var(--color-border)] last:border-0">
                      <div>
                        <div className="font-medium text-[var(--color-text)]">{TTB_EVENT_LABELS[ev.event_type]}</div>
                        {ev.notes && <div className="text-[var(--color-text-muted)] mt-0.5">{ev.notes}</div>}
                        <div className="text-[var(--color-text-muted)] mt-0.5">{formatDate(ev.occurred_at)}</div>
                      </div>
                      <div className="text-right font-mono shrink-0">
                        <div className={isPositive ? 'text-green-400' : 'text-red-400'}>
                          {isPositive ? '+' : '−'}{formatWineGal(ev.wine_gallons)}
                        </div>
                        {ev.proof_gallons != null && (
                          <div className="text-[var(--color-text-muted)]">
                            {isPositive ? '+' : '−'}{formatProofGal(ev.proof_gallons)}
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
