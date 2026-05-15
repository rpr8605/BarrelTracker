'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'

type Staff = {
  id: string
  name: string
  role: string | null
  nfc_tag_id: string | null
  hourly_rate: number | null
  is_active: boolean
}

type OpenEntry = { id: string; staff_member_id: string; clock_in: string }

type WeekEntry = {
  id: string
  staff_member_id: string
  clock_in: string
  clock_out: string | null
  nfc_verified: boolean
  approved_at: string | null
  staff_members: { name: string; hourly_rate: number | null } | null
}

function isoMonday(d = new Date()) {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  const day = (x.getDay() + 6) % 7
  x.setDate(x.getDate() - day)
  return x.toISOString().slice(0, 10)
}

export default function TimesheetsPage() {
  const [tab, setTab] = useState<'live' | 'week' | 'staff'>('live')
  const [staff, setStaff] = useState<Staff[]>([])
  const [open, setOpen] = useState<OpenEntry[]>([])
  const [weekEntries, setWeekEntries] = useState<WeekEntry[]>([])
  const [weekStart, setWeekStart] = useState(isoMonday())
  const [newStaff, setNewStaff] = useState({ name: '', role: '', nfc_tag_id: '', hourly_rate: '' })
  const [loading, setLoading] = useState(false)

  async function loadStaff() {
    const r = await fetch('/api/timesheets/staff').then((r) => r.json())
    setStaff(r.staff || [])
    setOpen(r.open_entries || [])
  }
  async function loadWeek() {
    const r = await fetch(`/api/timesheets/week?week_start=${weekStart}`).then((r) => r.json())
    setWeekEntries(r.entries || [])
  }

  useEffect(() => { loadStaff() }, [])
  useEffect(() => { if (tab === 'week') loadWeek() }, [tab, weekStart])

  async function toggleClock(staffId: string) {
    setLoading(true)
    await fetch('/api/timesheets/clock', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ staff_member_id: staffId }) })
    await loadStaff()
    setLoading(false)
  }

  async function approveEntry(id: string) {
    await fetch(`/api/timesheets/${id}/approve`, { method: 'PATCH' })
    await loadWeek()
  }

  async function approveAll() {
    const unapproved = weekEntries.filter((e) => !e.approved_at && e.clock_out)
    for (const e of unapproved) await fetch(`/api/timesheets/${e.id}/approve`, { method: 'PATCH' })
    await loadWeek()
  }

  async function createStaff() {
    if (!newStaff.name) return
    await fetch('/api/timesheets/staff', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newStaff.name,
        role: newStaff.role || null,
        nfc_tag_id: newStaff.nfc_tag_id || null,
        hourly_rate: newStaff.hourly_rate ? Number(newStaff.hourly_rate) : null,
      }),
    })
    setNewStaff({ name: '', role: '', nfc_tag_id: '', hourly_rate: '' })
    await loadStaff()
  }

  function durationHrs(inT: string, outT: string | null) {
    const start = new Date(inT)
    const end = outT ? new Date(outT) : new Date()
    return (end.getTime() - start.getTime()) / 3600000
  }

  const summaryByStaff = staff.map((s) => {
    const entries = weekEntries.filter((e) => e.staff_member_id === s.id)
    const totalHrs = entries.reduce((acc, e) => acc + (e.clock_out ? durationHrs(e.clock_in, e.clock_out) : 0), 0)
    const pay = s.hourly_rate ? totalHrs * s.hourly_rate : 0
    return { ...s, totalHrs, pay }
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-medium">Timesheets</h1>
        <Link href="/timesheets/clock"><Button variant="secondary">Open kiosk</Button></Link>
      </div>

      <div className="flex gap-2 border-b border-[var(--color-border)]">
        {(['live', 'week', 'staff'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm border-b-2 -mb-px ${tab === t ? 'border-primary text-primary' : 'border-transparent text-[var(--color-text-secondary)]'}`}
          >
            {t === 'live' ? 'Live clock' : t === 'week' ? 'Weekly summary' : 'Staff'}
          </button>
        ))}
      </div>

      {tab === 'live' && (
        <div className="space-y-3">
          {staff.filter((s) => s.is_active).map((s) => {
            const oe = open.find((o) => o.staff_member_id === s.id)
            const onClock = !!oe
            return (
              <Card key={s.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">{s.name}</div>
                    <div className="text-xs text-[var(--color-text-muted)]">{s.role || '—'}</div>
                    {onClock && <div className="text-xs text-primary mt-1">On clock since {new Date(oe!.clock_in).toLocaleTimeString()}</div>}
                  </div>
                  <Button onClick={() => toggleClock(s.id)} loading={loading} variant={onClock ? 'danger' : 'primary'} size="sm">
                    {onClock ? 'Clock out' : 'Clock in'}
                  </Button>
                </div>
              </Card>
            )
          })}
          {staff.filter((s) => s.is_active).length === 0 && (
            <Card><div className="text-sm text-[var(--color-text-muted)] text-center py-6">No active staff yet — add one from the Staff tab.</div></Card>
          )}
        </div>
      )}

      {tab === 'week' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <Input label="Week of (Mon)" type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} />
            <a
              href={`/api/timesheets/export?week_start=${weekStart}&week_end=${new Date(new Date(weekStart).getTime() + 7 * 86400000).toISOString().slice(0, 10)}`}
              className="px-4 py-2 rounded-lg border border-[var(--color-border)] text-sm min-h-[44px] inline-flex items-center"
            >
              Export CSV
            </a>
            <Button variant="secondary" onClick={approveAll}>Approve all completed</Button>
          </div>
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b border-[var(--color-border)]">
                    <th className="py-2">Staff</th>
                    <th className="py-2 text-right">Hours</th>
                    <th className="py-2 text-right">Pay</th>
                    <th className="py-2 text-right">Entries</th>
                  </tr>
                </thead>
                <tbody>
                  {summaryByStaff.map((s) => (
                    <tr key={s.id} className="border-b border-[var(--color-border)]/50">
                      <td className="py-2">{s.name}</td>
                      <td className="py-2 text-right">{s.totalHrs.toFixed(2)}</td>
                      <td className="py-2 text-right">{s.hourly_rate ? `$${s.pay.toFixed(2)}` : '—'}</td>
                      <td className="py-2 text-right">{weekEntries.filter((e) => e.staff_member_id === s.id).length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <div className="text-sm font-medium mb-3">All entries this week</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-left text-[var(--color-text-muted)]">
                    <th className="py-1">Staff</th><th className="py-1">In</th><th className="py-1">Out</th><th className="py-1">Hrs</th><th className="py-1">NFC</th><th className="py-1">Approved</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {weekEntries.map((e) => (
                    <tr key={e.id} className="border-t border-[var(--color-border)]/50">
                      <td className="py-1">{e.staff_members?.name}</td>
                      <td className="py-1">{new Date(e.clock_in).toLocaleString()}</td>
                      <td className="py-1">{e.clock_out ? new Date(e.clock_out).toLocaleString() : '—'}</td>
                      <td className="py-1">{e.clock_out ? durationHrs(e.clock_in, e.clock_out).toFixed(2) : '—'}</td>
                      <td className="py-1">{e.nfc_verified ? '✓' : ''}</td>
                      <td className="py-1">{e.approved_at ? '✓' : ''}</td>
                      <td className="py-1">{!e.approved_at && e.clock_out && <Button size="sm" variant="ghost" onClick={() => approveEntry(e.id)}>Approve</Button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {tab === 'staff' && (
        <div className="space-y-4">
          <Card>
            <div className="text-sm font-medium mb-3">Add staff member</div>
            <div className="grid md:grid-cols-4 gap-3">
              <Input label="Name" value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} />
              <Input label="Role" value={newStaff.role} onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value })} />
              <Input label="NFC tag ID" value={newStaff.nfc_tag_id} onChange={(e) => setNewStaff({ ...newStaff, nfc_tag_id: e.target.value })} />
              <Input label="Hourly rate" type="number" step="0.01" value={newStaff.hourly_rate} onChange={(e) => setNewStaff({ ...newStaff, hourly_rate: e.target.value })} />
            </div>
            <div className="mt-3"><Button onClick={createStaff}>Add staff member</Button></div>
          </Card>
          <Card>
            <div className="text-sm font-medium mb-3">All staff</div>
            <div className="space-y-2">
              {staff.map((s) => (
                <StaffEditor key={s.id} staff={s} onSaved={loadStaff} />
              ))}
              {staff.length === 0 && <div className="text-sm text-[var(--color-text-muted)] text-center py-4">No staff yet.</div>}
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}

function StaffEditor({ staff, onSaved }: { staff: Staff; onSaved: () => void }) {
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name: staff.name, role: staff.role || '', nfc_tag_id: staff.nfc_tag_id || '', hourly_rate: staff.hourly_rate?.toString() || '', is_active: staff.is_active })

  async function save() {
    await fetch(`/api/timesheets/staff/${staff.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        role: form.role || null,
        nfc_tag_id: form.nfc_tag_id || null,
        hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : null,
        is_active: form.is_active,
      }),
    })
    setEditing(false)
    onSaved()
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between p-3 rounded-lg border border-[var(--color-border)]">
        <div>
          <div className="font-medium">{staff.name} {!staff.is_active && <span className="text-xs text-[var(--color-text-muted)]">(inactive)</span>}</div>
          <div className="text-xs text-[var(--color-text-muted)]">{staff.role || '—'} · NFC: {staff.nfc_tag_id || '—'} · ${staff.hourly_rate ?? '—'}/hr</div>
        </div>
        <Button size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit</Button>
      </div>
    )
  }
  return (
    <div className="p-3 rounded-lg border border-[var(--color-border)] space-y-2">
      <div className="grid md:grid-cols-4 gap-2">
        <Input label="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <Input label="Role" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} />
        <Input label="NFC tag" value={form.nfc_tag_id} onChange={(e) => setForm({ ...form, nfc_tag_id: e.target.value })} />
        <Input label="Hourly rate" type="number" step="0.01" value={form.hourly_rate} onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })} />
      </div>
      <Select label="Status" value={form.is_active ? 'true' : 'false'} onChange={(e) => setForm({ ...form, is_active: e.target.value === 'true' })}>
        <option value="true">Active</option><option value="false">Inactive</option>
      </Select>
      <div className="flex gap-2"><Button size="sm" onClick={save}>Save</Button><Button size="sm" variant="ghost" onClick={() => setEditing(false)}>Cancel</Button></div>
    </div>
  )
}
