'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

interface UserRow {
  id: string
  email: string
  created_at: string
  last_sign_in_at: string | null
  banned_until: string | null
  app_metadata: { role?: string; plan?: string; grandfathered?: boolean }
  user_metadata: { first_name?: string; last_name?: string }
  distillery: { id: string; name: string; slug: string; plan: string } | null
}

interface Stats {
  totalUsers: number
  distilleryOwners: number
  consumers: number
  suspended: number
  newUsersLast30Days: number
  totalBarrels: number
  totalFollowers: number
  totalSponsorships: number
  platformMrr: number
}

interface AuditEntry {
  id: string
  admin_email: string
  action: string
  target_email: string | null
  metadata: Record<string, unknown>
  created_at: string
}

interface Props {
  adminEmail: string
  initialUsers: UserRow[]
  initialTotal: number
  initialStats: Stats
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-[#141414] border border-white/10 rounded-lg p-4">
      <div className="text-xs text-white/50 uppercase tracking-widest mb-1">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
      {sub && <div className="text-xs text-white/40 mt-1">{sub}</div>}
    </div>
  )
}

function roleBadge(role?: string) {
  const map: Record<string, string> = {
    super_admin: 'bg-amber-600 text-white',
    distillery_owner: 'bg-blue-700 text-white',
    consumer: 'bg-zinc-700 text-white/70',
  }
  const cls = map[role ?? ''] ?? 'bg-zinc-800 text-white/50'
  return <span className={`text-xs px-2 py-0.5 rounded font-mono ${cls}`}>{role ?? 'none'}</span>
}

function statusBadge(user: UserRow) {
  if (user.banned_until) return <span className="text-xs px-2 py-0.5 rounded bg-red-900 text-red-300">suspended</span>
  return <span className="text-xs px-2 py-0.5 rounded bg-green-900 text-green-300">active</span>
}

function initials(u: UserRow) {
  const f = u.user_metadata?.first_name?.[0] ?? u.email[0]
  const l = u.user_metadata?.last_name?.[0] ?? ''
  return (f + l).toUpperCase()
}

function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function PasswordStrength({ password }: { password: string }) {
  const hasUpper = /[A-Z]/.test(password)
  const hasNum = /[0-9]/.test(password)
  const hasSpecial = /[^A-Za-z0-9]/.test(password)
  const score = (password.length >= 12 ? 1 : 0) + (hasUpper ? 1 : 0) + (hasNum ? 1 : 0) + (hasSpecial ? 1 : 0)
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong']
  const colors = ['', 'bg-red-500', 'bg-orange-400', 'bg-yellow-400', 'bg-green-500']
  if (!password) return null
  return (
    <div className="flex items-center gap-2 mt-1">
      <div className="flex gap-0.5 flex-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`h-1 flex-1 rounded ${i <= score ? colors[score] : 'bg-white/10'}`} />
        ))}
      </div>
      <span className="text-xs text-white/50">{labels[score]}</span>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="text-xs px-3 py-1 rounded bg-amber-700 hover:bg-amber-600 text-white transition-colors"
    >
      {copied ? 'Copied!' : 'Copy'}
    </button>
  )
}

export function MasterDashboard({ adminEmail, initialUsers, initialTotal, initialStats }: Props) {
  const [view, setView] = useState<'users' | 'audit'>('users')
  const [users, setUsers] = useState<UserRow[]>(initialUsers)
  const [total, setTotal] = useState(initialTotal)
  const [stats] = useState<Stats>(initialStats)
  const [page, setPage] = useState(1)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<UserRow | null>(null)
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [magicLink, setMagicLink] = useState<{ url: string; expiresAt: string } | null>(null)
  const [pwForm, setPwForm] = useState({ pw: '', confirm: '' })
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwError, setPwError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [actionLoading, setActionLoading] = useState('')
  const [toast, setToast] = useState('')
  const searchTimer = useRef<ReturnType<typeof setTimeout>>()

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 3000) }

  const fetchUsers = useCallback(async (p: number, q: string) => {
    setLoading(true)
    try {
      const r = await fetch(`/api/admin/master/users?page=${p}&limit=25&query=${encodeURIComponent(q)}`, {
        credentials: 'include',
        headers: { 'x-still-admin-key': getCookie('x-still-admin-key') ?? '' },
      })
      if (r.ok) {
        const d = await r.json()
        setUsers(d.users)
        setTotal(d.total)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchAudit = useCallback(async () => {
    setAuditLoading(true)
    try {
      const r = await fetch('/api/admin/master/audit?limit=100', {
        credentials: 'include',
        headers: { 'x-still-admin-key': getCookie('x-still-admin-key') ?? '' },
      })
      if (r.ok) { const d = await r.json(); setAuditLog(d.entries ?? []) }
    } finally {
      setAuditLoading(false)
    }
  }, [])

  useEffect(() => {
    if (view === 'audit') fetchAudit()
  }, [view, fetchAudit])

  const handleSearch = (q: string) => {
    setQuery(q)
    clearTimeout(searchTimer.current)
    searchTimer.current = setTimeout(() => { setPage(1); fetchUsers(1, q) }, 300)
  }

  const adminAction = async (
    path: string,
    method: string,
    body?: Record<string, unknown>,
    label?: string
  ) => {
    setActionLoading(label ?? path)
    try {
      const r = await fetch(`/api/admin/master/users/${selected!.id}/${path}`, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'x-still-admin-key': getCookie('x-still-admin-key') ?? '',
        },
        body: body ? JSON.stringify(body) : undefined,
      })
      const d = await r.json()
      if (!r.ok) { showToast(d.error ?? 'Error'); return null }
      return d
    } finally {
      setActionLoading('')
    }
  }

  const handleMagicLink = async () => {
    const d = await adminAction('magic-link', 'POST', undefined, 'magic')
    if (d?.url) setMagicLink({ url: d.url, expiresAt: d.expiresAt })
  }

  const handleSetPassword = async () => {
    if (pwForm.pw !== pwForm.confirm) { setPwError('Passwords do not match'); return }
    if (pwForm.pw.length < 8) { setPwError('Minimum 8 characters'); return }
    setPwError('')
    const d = await adminAction('set-password', 'POST', { password: pwForm.pw }, 'pw')
    if (d?.success) { setPwSuccess(true); setPwForm({ pw: '', confirm: '' }) }
  }

  const handleSuspend = async () => {
    const d = await adminAction('suspend', 'POST', undefined, 'suspend')
    if (d?.suspended) { showToast('User suspended'); fetchUsers(page, query); setSelected(null) }
  }

  const handleReactivate = async () => {
    const d = await adminAction('reactivate', 'POST', undefined, 'reactivate')
    if (d?.reactivated) { showToast('User reactivated'); fetchUsers(page, query); setSelected(null) }
  }

  const handleDelete = async () => {
    if (deleteConfirm !== 'DELETE') return
    const r = await fetch(`/api/admin/master/users/${selected!.id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', 'x-still-admin-key': getCookie('x-still-admin-key') ?? '' },
      body: JSON.stringify({ confirm: 'DELETE' }),
    })
    if (r.ok) { showToast('User deleted'); fetchUsers(page, query); setSelected(null) }
  }

  const exportAuditCsv = () => {
    const header = 'timestamp,admin,action,target,details\n'
    const rows = auditLog.map((e) =>
      `"${e.created_at}","${e.admin_email}","${e.action}","${e.target_email ?? ''}","${JSON.stringify(e.metadata ?? {}).replace(/"/g, '""')}"`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'audit-log.csv'; a.click()
  }

  const totalPages = Math.ceil(total / 25)

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-amber-700 text-white px-4 py-2 rounded shadow-lg text-sm">{toast}</div>
      )}

      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#111]">
        <span className="font-bold text-amber-500 tracking-wide">Still — Master Admin</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/50">{adminEmail}</span>
          <a href="/dashboard" className="text-xs text-white/40 hover:text-white/70">← Dashboard</a>
        </div>
      </div>

      {/* View toggle */}
      <div className="px-6 pt-4 flex gap-2">
        <button onClick={() => setView('users')} className={`text-sm px-4 py-1.5 rounded ${view === 'users' ? 'bg-amber-700 text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>Users</button>
        <button onClick={() => setView('audit')} className={`text-sm px-4 py-1.5 rounded ${view === 'audit' ? 'bg-amber-700 text-white' : 'bg-white/5 text-white/50 hover:text-white'}`}>Audit Log</button>
      </div>

      {view === 'users' && (
        <div className="px-6 py-4">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatCard label="Total Users" value={stats.totalUsers} sub={`+${stats.newUsersLast30Days} this month`} />
            <StatCard label="Distilleries" value={stats.distilleryOwners} />
            <StatCard label="Consumers" value={stats.consumers} />
            <StatCard label="Suspended" value={stats.suspended} />
            <StatCard label="Sponsorship $" value={`$${(stats.platformMrr / 100).toFixed(0)}`} sub={`${stats.totalSponsorships} active`} />
          </div>

          {/* Search */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search users by email..."
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full md:w-96 px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-white/30 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Table */}
          <div className="border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">User</th>
                  <th className="px-4 py-3 text-left">Role</th>
                  <th className="px-4 py-3 text-left">Distillery</th>
                  <th className="px-4 py-3 text-left">Last login</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-white/30">Loading...</td></tr>
                )}
                {!loading && users.length === 0 && (
                  <tr><td colSpan={6} className="px-4 py-8 text-center text-white/30">No users found</td></tr>
                )}
                {!loading && users.map((u) => (
                  <tr key={u.id} className="border-t border-white/5 hover:bg-white/5 cursor-pointer" onClick={() => { setSelected(u); setMagicLink(null); setPwSuccess(false); setPwForm({ pw: '', confirm: '' }); setDeleteConfirm('') }}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-amber-800 flex items-center justify-center text-xs font-bold shrink-0">{initials(u)}</div>
                        <div>
                          <div className="font-medium">{u.user_metadata?.first_name} {u.user_metadata?.last_name}</div>
                          <div className="text-white/40 text-xs">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">{roleBadge(u.app_metadata?.role)}</td>
                    <td className="px-4 py-3 text-white/60 text-xs">{u.distillery?.name ?? '—'}</td>
                    <td className="px-4 py-3 text-white/50 text-xs">{fmt(u.last_sign_in_at)}</td>
                    <td className="px-4 py-3">{statusBadge(u)}</td>
                    <td className="px-4 py-3">
                      <button onClick={(e) => { e.stopPropagation(); setSelected(u); setMagicLink(null); setPwSuccess(false); setPwForm({ pw: '', confirm: '' }); setDeleteConfirm('') }} className="text-xs px-3 py-1 rounded bg-white/10 hover:bg-white/20">Manage</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-3 mt-4 text-sm">
              <button disabled={page === 1} onClick={() => { setPage(page - 1); fetchUsers(page - 1, query) }} className="px-3 py-1 rounded bg-white/10 disabled:opacity-30">Prev</button>
              <span className="text-white/40">{page} / {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => { setPage(page + 1); fetchUsers(page + 1, query) }} className="px-3 py-1 rounded bg-white/10 disabled:opacity-30">Next</button>
            </div>
          )}
        </div>
      )}

      {view === 'audit' && (
        <div className="px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white/70">Platform Audit Log</h2>
            <button onClick={exportAuditCsv} className="text-xs px-3 py-1.5 rounded bg-white/10 hover:bg-white/20">Export CSV</button>
          </div>
          <div className="border border-white/10 rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-white/5 text-white/50 text-xs uppercase tracking-wide">
                <tr>
                  <th className="px-4 py-3 text-left">Time</th>
                  <th className="px-4 py-3 text-left">Admin</th>
                  <th className="px-4 py-3 text-left">Action</th>
                  <th className="px-4 py-3 text-left">Target</th>
                  <th className="px-4 py-3 text-left">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLoading && <tr><td colSpan={5} className="px-4 py-8 text-center text-white/30">Loading...</td></tr>}
                {!auditLoading && auditLog.map((e) => (
                  <tr key={e.id} className="border-t border-white/5">
                    <td className="px-4 py-2 text-white/40 text-xs font-mono">{new Date(e.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-white/60 text-xs">{e.admin_email}</td>
                    <td className="px-4 py-2"><span className="font-mono text-xs text-amber-400">{e.action}</span></td>
                    <td className="px-4 py-2 text-white/50 text-xs">{e.target_email ?? '—'}</td>
                    <td className="px-4 py-2 text-white/30 text-xs font-mono truncate max-w-xs">{JSON.stringify(e.metadata)}</td>
                  </tr>
                ))}
                {!auditLoading && auditLog.length === 0 && (
                  <tr><td colSpan={5} className="px-4 py-8 text-center text-white/30">No audit entries yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User detail panel */}
      {selected && (
        <div className="fixed inset-y-0 right-0 w-[380px] bg-[#111] border-l border-white/10 z-40 overflow-y-auto flex flex-col">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-800 flex items-center justify-center font-bold">{initials(selected)}</div>
              <div>
                <div className="font-semibold">{selected.user_metadata?.first_name} {selected.user_metadata?.last_name}</div>
                <div className="text-xs text-white/40">{selected.email}</div>
              </div>
            </div>
            <button onClick={() => setSelected(null)} className="text-white/40 hover:text-white text-xl leading-none">×</button>
          </div>

          <div className="px-5 py-4 border-b border-white/10 space-y-2 text-xs">
            <div className="flex justify-between"><span className="text-white/40">Supabase ID</span><span className="font-mono text-white/70 select-all">{selected.id.slice(0, 16)}…</span></div>
            <div className="flex justify-between"><span className="text-white/40">Role</span>{roleBadge(selected.app_metadata?.role)}</div>
            <div className="flex justify-between"><span className="text-white/40">Status</span>{statusBadge(selected)}</div>
            <div className="flex justify-between"><span className="text-white/40">Distillery</span><span className="text-white/70">{selected.distillery?.name ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Plan</span><span className="text-white/70">{selected.distillery?.plan ?? selected.app_metadata?.plan ?? '—'}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Joined</span><span className="text-white/70">{fmt(selected.created_at)}</span></div>
            <div className="flex justify-between"><span className="text-white/40">Last login</span><span className="text-white/70">{fmt(selected.last_sign_in_at)}</span></div>
            {selected.app_metadata?.grandfathered && <div className="text-amber-500 text-xs">★ Grandfathered founder</div>}
          </div>

          <div className="px-5 py-4 space-y-4 flex-1">
            {/* Magic link */}
            <div>
              <button disabled={actionLoading === 'magic'} onClick={handleMagicLink} className="w-full text-sm py-2 rounded bg-amber-700 hover:bg-amber-600 disabled:opacity-50">
                {actionLoading === 'magic' ? 'Generating…' : 'Generate Magic Link'}
              </button>
              {magicLink && (
                <div className="mt-2 p-3 bg-black/40 rounded border border-white/10">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-white/40">Expires {fmt(magicLink.expiresAt)}</span>
                    <CopyButton text={magicLink.url} />
                  </div>
                  <div className="text-xs font-mono text-white/60 break-all">{magicLink.url}</div>
                  <a href={magicLink.url} target="_blank" rel="noreferrer" className="text-xs text-amber-400 hover:underline mt-1 block">Open in new tab →</a>
                  <div className="text-xs text-red-400 mt-1">⚠ Signs them in immediately — do not share publicly</div>
                </div>
              )}
            </div>

            {/* Set password */}
            <div>
              <div className="text-xs text-white/40 mb-2 font-semibold uppercase tracking-wide">Set Password</div>
              <input type="password" placeholder="New password" value={pwForm.pw} onChange={(e) => setPwForm((p) => ({ ...p, pw: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 mb-1" />
              <PasswordStrength password={pwForm.pw} />
              <input type="password" placeholder="Confirm password" value={pwForm.confirm} onChange={(e) => setPwForm((p) => ({ ...p, confirm: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded text-sm text-white placeholder-white/20 focus:outline-none focus:border-amber-500 mt-1" />
              {pwError && <div className="text-xs text-red-400 mt-1">{pwError}</div>}
              <button disabled={actionLoading === 'pw'} onClick={handleSetPassword} className="w-full mt-2 text-sm py-2 rounded bg-white/10 hover:bg-white/20 disabled:opacity-50">
                {actionLoading === 'pw' ? 'Setting…' : 'Set Password'}
              </button>
              {pwSuccess && (
                <div className="mt-2 p-2 bg-green-900/30 rounded border border-green-700/40 text-xs text-green-300">
                  Password updated. Consider sending a magic link instead — it&apos;s safer.
                  <button onClick={handleMagicLink} className="block text-amber-400 hover:underline mt-1">Generate magic link →</button>
                </div>
              )}
            </div>

            {/* Impersonate */}
            <div>
              <button onClick={() => {
                document.cookie = `viewing_as_distillery_id=${selected.distillery?.id ?? ''};path=/`
                document.cookie = `viewing_as_distillery_name=${selected.distillery?.name ?? selected.email};path=/`
                window.open('/dashboard', '_blank')
              }} className="w-full text-sm py-2 rounded bg-white/10 hover:bg-white/20">
                View Their Dashboard ↗
              </button>
            </div>

            {/* Suspend / Reactivate */}
            {selected.banned_until ? (
              <button disabled={actionLoading === 'reactivate'} onClick={handleReactivate} className="w-full text-sm py-2 rounded bg-green-800 hover:bg-green-700 disabled:opacity-50">
                {actionLoading === 'reactivate' ? 'Reactivating…' : 'Reactivate User'}
              </button>
            ) : (
              <button disabled={actionLoading === 'suspend'} onClick={handleSuspend} className="w-full text-sm py-2 rounded bg-red-900 hover:bg-red-800 disabled:opacity-50">
                {actionLoading === 'suspend' ? 'Suspending…' : 'Suspend User'}
              </button>
            )}

            {/* Delete */}
            <div className="border border-red-900/40 rounded p-3">
              <div className="text-xs text-red-400 mb-2 font-semibold">Danger Zone</div>
              <input type="text" placeholder='Type "DELETE" to confirm' value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                className="w-full px-3 py-2 bg-white/5 border border-red-900/40 rounded text-sm text-white placeholder-white/20 focus:outline-none focus:border-red-500 mb-2" />
              <button disabled={deleteConfirm !== 'DELETE'} onClick={handleDelete}
                className="w-full text-sm py-2 rounded bg-red-900 hover:bg-red-800 disabled:opacity-30 disabled:cursor-not-allowed">
                Delete User Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  return document.cookie.split('; ').find((r) => r.startsWith(name + '='))?.split('=')[1]
}
