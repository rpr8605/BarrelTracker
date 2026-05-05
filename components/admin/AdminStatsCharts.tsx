'use client'
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { useMemo } from 'react'

interface Props {
  distilleries: { id: string; name: string; plan: string; created_at: string }[]
  follows: { created_at: string; entity_type: string }[]
  sponsorships: { tier: string; amount_cents: number; platform_fee_cents: number; created_at: string }[]
  qrEvents: { scanned_at: string; state: string; distillery_id: string }[]
}

const TIER_COLORS: Record<string, string> = {
  FOLLOWER: '#94a3b8',
  SUPPORTER: '#60a5fa',
  SPONSOR: '#f59e0b',
  PARTNER: '#BA7517',
}

export function AdminStatsCharts({ distilleries, follows, sponsorships, qrEvents }: Props) {
  const followerGrowth = useMemo(() => {
    const byMonth: Record<string, number> = {}
    for (const f of follows.filter((f) => f.entity_type === 'barrel')) {
      const month = f.created_at.slice(0, 7)
      byMonth[month] = (byMonth[month] ?? 0) + 1
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, count }))
  }, [follows])

  const distilleryGrowth = useMemo(() => {
    const byMonth: Record<string, number> = {}
    for (const d of distilleries) {
      const month = d.created_at.slice(0, 7)
      byMonth[month] = (byMonth[month] ?? 0) + 1
    }
    return Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, count]) => ({ month, count }))
  }, [distilleries])

  const sponsorByTier = useMemo(() => {
    const map: Record<string, number> = {}
    for (const sp of sponsorships) {
      map[sp.tier] = (map[sp.tier] ?? 0) + sp.platform_fee_cents
    }
    return Object.entries(map).map(([tier, revenue]) => ({ tier, revenue: revenue / 100 }))
  }, [sponsorships])

  const qrByDistillery = useMemo(() => {
    const map: Record<string, number> = {}
    for (const ev of qrEvents) {
      const dist = distilleries.find((d) => d.id === ev.distillery_id)
      const key = dist?.name ?? ev.distillery_id.slice(0, 8)
      map[key] = (map[key] ?? 0) + 1
    }
    return Object.entries(map)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }))
  }, [qrEvents, distilleries])

  const chartHeight = 220

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="card p-4">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">Follower Growth (12 months)</h3>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={followerGrowth}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#BA7517" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">New Clients (12 months)</h3>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={distilleryGrowth}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="count" stroke="#60a5fa" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">Sponsorship Revenue by Tier</h3>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <PieChart>
            <Pie data={sponsorByTier} dataKey="revenue" nameKey="tier" cx="50%" cy="50%" outerRadius={80}>
              {sponsorByTier.map((entry) => (
                <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] ?? '#94a3b8'} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => `$${Number(v).toFixed(2)}`} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="card p-4">
        <h3 className="text-sm font-medium text-[var(--color-text)] mb-4">QR Scans by Distillery</h3>
        <ResponsiveContainer width="100%" height={chartHeight}>
          <BarChart data={qrByDistillery} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10 }} />
            <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#BA7517" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
