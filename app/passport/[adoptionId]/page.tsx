'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import { formatDate, formatMonths } from '@/lib/utils'
import { getBarrelAgeMonths } from '@/lib/tags'
import type { Barrel, VoiceNote } from '@/types/database'

interface Adoption {
  id: string
  barrel_id: string
  user_id: string
  tier: 'full' | 'share'
  status: string
  created_at: string
}

interface BarrelFull extends Barrel {
  distillery_name?: string
}

function StatusBadge({ status }: { status: Barrel['status'] }) {
  const map: Record<string, { label: string; cls: string }> = {
    aging:   { label: 'Aging',   cls: 'bg-amber-700/30 text-amber-300 border border-amber-700/40' },
    ready:   { label: 'Ready',   cls: 'bg-green-800/30 text-green-300 border border-green-800/40' },
    bottled: { label: 'Bottled', cls: 'bg-neutral-700/40 text-neutral-400 border border-neutral-700/40' },
    dumped:  { label: 'Dumped',  cls: 'bg-neutral-700/40 text-neutral-400 border border-neutral-700/40' },
  }
  const s = map[status] ?? map.aging
  return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${s.cls}`}>{s.label}</span>
}

function NoteCard({ note }: { note: VoiceNote }) {
  return (
    <div className="p-4 rounded-xl bg-white/5 border border-white/8 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs text-[#f5f0e8]/40">{formatDate(note.recorded_at)}</span>
        {note.duration_seconds && (
          <span className="text-xs text-[#f5f0e8]/30">{Math.round(note.duration_seconds)}s</span>
        )}
      </div>
      {note.ai_extracted_tags && note.ai_extracted_tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {note.ai_extracted_tags.map((tag) => (
            <span key={tag} className="px-2 py-0.5 bg-[#BA7517]/15 text-[#BA7517] border border-[#BA7517]/25 rounded-full text-xs">
              {tag}
            </span>
          ))}
        </div>
      )}
      <p className="text-sm text-[#f5f0e8]/70 leading-relaxed">
        {note.transcript ?? <em className="text-[#f5f0e8]/30">Audio note — transcript processing</em>}
      </p>
    </div>
  )
}

export default function PassportPage({ params }: { params: { adoptionId: string } }) {
  const [adoption, setAdoption] = useState<Adoption | null>(null)
  const [barrel, setBarrel] = useState<BarrelFull | null>(null)
  const [notes, setNotes] = useState<VoiceNote[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const load = useCallback(async () => {
    const supabase = createClient()

    const { data: adoptionData, error: aErr } = await supabase
      .from('adoptions')
      .select('*')
      .eq('id', params.adoptionId)
      .single()

    if (aErr || !adoptionData) {
      setError('Passport not found. Check your link and try again.')
      setLoading(false)
      return
    }
    setAdoption(adoptionData as Adoption)

    const { data: barrelData } = await supabase
      .from('barrels')
      .select('*')
      .eq('id', adoptionData.barrel_id)
      .single()

    if (barrelData) {
      const b = barrelData as BarrelFull
      // Fetch distillery name
      const { data: dist } = await supabase
        .from('distilleries')
        .select('name')
        .eq('id', b.distillery_id)
        .single()
      b.distillery_name = dist?.name ?? undefined
      setBarrel(b)

      // Voice notes
      const { data: notesData } = await supabase
        .from('voice_notes')
        .select('*')
        .eq('barrel_id', b.id)
        .order('recorded_at', { ascending: false })
      setNotes((notesData as VoiceNote[]) ?? [])
    }

    setLoading(false)
  }, [params.adoptionId])

  useEffect(() => {
    load()
  }, [load])

  // Realtime subscription for new voice notes
  useEffect(() => {
    if (!barrel) return
    const supabase = createClient()
    const channel = supabase
      .channel(`passport-notes-${barrel.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'voice_notes', filter: `barrel_id=eq.${barrel.id}` },
        (payload) => {
          setNotes((prev) => [payload.new as VoiceNote, ...prev])
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [barrel])

  function copyLink() {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f0b07] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#BA7517] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !adoption || !barrel) {
    return (
      <div className="min-h-screen bg-[#0f0b07] text-[#f5f0e8] flex items-center justify-center px-5">
        <div className="text-center space-y-3">
          <p className="text-[#BA7517] font-medium">Still</p>
          <p className="text-lg font-medium">{error ?? 'Passport unavailable'}</p>
          <p className="text-sm text-[#f5f0e8]/40">This passport link may be invalid or the adoption is pending.</p>
        </div>
      </div>
    )
  }

  const ageMonths = getBarrelAgeMonths(barrel.entry_date)
  const warehousePos = [
    barrel.warehouse_row && `Row ${barrel.warehouse_row}`,
    barrel.warehouse_slot && `Slot ${barrel.warehouse_slot}`,
    barrel.warehouse_tier && `Tier ${barrel.warehouse_tier}`,
  ].filter(Boolean).join(' · ')

  return (
    <div className="min-h-screen bg-[#0f0b07] text-[#f5f0e8]">
      {/* Header */}
      <div className="border-b border-white/5 px-5 py-4 flex items-center justify-between">
        <span className="text-[#BA7517] font-semibold tracking-wide text-sm">Still</span>
        <span className="text-xs text-[#f5f0e8]/30">Barrel Passport</span>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-10 space-y-10">

        {/* Hero */}
        <div className="space-y-1">
          <p className="text-[#BA7517] text-xs font-medium tracking-widest uppercase">{barrel.distillery_name ?? 'Your Distillery'}</p>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <h1 className="text-3xl font-semibold">Your Barrel</h1>
              <p className="text-[#f5f0e8]/60 text-lg mt-0.5">#{barrel.barrel_number}</p>
            </div>
            <StatusBadge status={barrel.status} />
          </div>
          <p className="text-sm text-[#f5f0e8]/40">
            Adopted {formatDate(adoption.created_at)} · {adoption.tier === 'full' ? 'Full Barrel' : '1/10 Share'}
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: 'Entry Proof', value: barrel.entry_proof ? `${barrel.entry_proof}°` : '—' },
            { label: 'Current Proof', value: barrel.current_proof_estimate ? `~${barrel.current_proof_estimate}°` : '—' },
            { label: 'Age', value: formatMonths(ageMonths) },
            { label: "Angel's Share", value: barrel.angels_share_pct ? `${barrel.angels_share_pct.toFixed(1)}%` : '—' },
            { label: 'Warehouse', value: warehousePos || '—' },
            { label: 'Grain', value: barrel.grain_type?.join(', ') || barrel.mash_bill || '—' },
          ].map(({ label, value }) => (
            <div key={label} className="p-4 rounded-xl bg-white/5 border border-white/8">
              <p className="text-xs text-[#f5f0e8]/40 uppercase tracking-widest mb-1">{label}</p>
              <p className="text-base font-medium">{value}</p>
            </div>
          ))}
        </div>

        {/* Predicted bottling */}
        {barrel.predicted_peak_date && (
          <div className="flex items-center gap-3 p-4 rounded-xl bg-[#BA7517]/8 border border-[#BA7517]/20">
            <span className="text-xl">📅</span>
            <div>
              <p className="text-sm font-medium">Expected Ready</p>
              <p className="text-xs text-[#f5f0e8]/50 mt-0.5">{formatDate(barrel.predicted_peak_date)}</p>
            </div>
          </div>
        )}

        {/* Flavor tags */}
        {barrel.tags && barrel.tags.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-[#f5f0e8]/40 uppercase tracking-widest">Flavor Profile</p>
            <div className="flex flex-wrap gap-2">
              {barrel.tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-[#BA7517]/15 text-[#BA7517] border border-[#BA7517]/25 rounded-full text-xs font-medium">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Photo gallery */}
        {barrel.photos && barrel.photos.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-medium text-[#f5f0e8]/40 uppercase tracking-widest">Photos</p>
            <div className="grid grid-cols-3 gap-2">
              {barrel.photos.map((url, i) => (
                <div key={i} className="aspect-square rounded-lg overflow-hidden bg-white/5">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Barrel photo ${i + 1}`} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Distiller's Log */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-[#f5f0e8]/40 uppercase tracking-widest">Distiller&apos;s Log</p>
            <span className="text-xs text-[#f5f0e8]/30">{notes.length} entries</span>
          </div>
          {notes.length === 0 ? (
            <div className="p-6 rounded-xl bg-white/5 border border-white/8 text-center">
              <p className="text-sm text-[#f5f0e8]/40">No log entries yet. Check back after your next distillery visit.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((note) => <NoteCard key={note.id} note={note} />)}
            </div>
          )}
        </div>

        {/* Share */}
        <div className="border-t border-white/8 pt-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="text-sm font-medium">Share your passport</p>
              <p className="text-xs text-[#f5f0e8]/40 mt-0.5">Anyone with this link can view your barrel&apos;s journey</p>
            </div>
            <button
              onClick={copyLink}
              className="px-4 py-2 rounded-lg border border-[#BA7517]/30 text-[#BA7517] text-sm hover:bg-[#BA7517]/10 transition-colors"
            >
              {copied ? 'Copied!' : 'Copy link'}
            </button>
          </div>
        </div>

        <p className="text-xs text-[#f5f0e8]/20 text-center pb-4">Powered by Still · Craft Distillery Management</p>
      </div>
    </div>
  )
}
