'use client'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/Button'
import { isNFCSupported, scanNFCTag } from '@/lib/nfc'

type Staff = { id: string; name: string; is_active: boolean }
type OpenEntry = { staff_member_id: string; clock_in: string }

export default function ClockKioskPage() {
  const [staff, setStaff] = useState<Staff[]>([])
  const [open, setOpen] = useState<OpenEntry[]>([])
  const [scanning, setScanning] = useState(false)
  const [flash, setFlash] = useState<{ name: string; action: string } | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [nfcAvail, setNfcAvail] = useState(false)

  useEffect(() => {
    setNfcAvail(isNFCSupported())
    refresh()
    const t = setInterval(refresh, 15000)
    return () => clearInterval(t)
  }, [])

  async function refresh() {
    const r = await fetch('/api/timesheets/staff').then((r) => r.json())
    setStaff(r.staff || [])
    setOpen(r.open_entries || [])
  }

  async function clockByStaffId(id: string) {
    setErr(null)
    const r = await fetch('/api/timesheets/clock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ staff_member_id: id }),
    }).then((r) => r.json())
    if (r.error) return setErr(r.error)
    setFlash({ name: r.staff_name, action: r.action === 'clock_in' ? 'Clocked in' : 'Clocked out' })
    setTimeout(() => setFlash(null), 3000)
    refresh()
  }

  async function tapAndClock() {
    setScanning(true)
    setErr(null)
    try {
      const tag = await scanNFCTag()
      const tagId = tag.text || tag.url || ''
      if (!tagId) throw new Error('Empty tag')
      const r = await fetch('/api/timesheets/clock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nfc_tag_id: tagId }),
      }).then((r) => r.json())
      if (r.error) return setErr(r.error)
      setFlash({ name: r.staff_name, action: r.action === 'clock_in' ? 'Clocked in' : 'Clocked out' })
      setTimeout(() => setFlash(null), 3000)
      refresh()
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'NFC scan failed')
    } finally {
      setScanning(false)
    }
  }

  if (flash) {
    return (
      <div className="fixed inset-0 flex flex-col items-center justify-center bg-primary text-white">
        <div className="text-6xl mb-4">✓</div>
        <div className="text-3xl font-medium">{flash.name}</div>
        <div className="text-xl opacity-80 mt-2">{flash.action}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center -m-4 md:-m-6">
      <h1 className="text-4xl md:text-6xl font-medium mb-6">TAP TO CLOCK</h1>
      {nfcAvail ? (
        <Button size="lg" loading={scanning} onClick={tapAndClock} className="text-2xl px-12 py-8 min-h-[120px]">
          {scanning ? 'Hold tag to phone…' : 'Tap NFC badge'}
        </Button>
      ) : (
        <div className="text-sm text-[var(--color-text-muted)]">NFC not supported on this device — pick yourself below.</div>
      )}
      {err && <div className="mt-4 text-danger text-sm">{err}</div>}
      <div className="mt-12 w-full max-w-md">
        <div className="text-sm text-[var(--color-text-muted)] mb-3">Or pick your name</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {staff.filter((s) => s.is_active).map((s) => {
            const isOn = open.some((o) => o.staff_member_id === s.id)
            return (
              <button
                key={s.id}
                onClick={() => clockByStaffId(s.id)}
                className={`p-4 rounded-lg border min-h-[64px] text-base font-medium ${isOn ? 'border-primary text-primary bg-primary/5' : 'border-[var(--color-border)]'}`}
              >
                {s.name}{isOn ? ' (on clock)' : ''}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
