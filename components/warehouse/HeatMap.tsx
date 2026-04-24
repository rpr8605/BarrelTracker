'use client'
import { useState } from 'react'
import Link from 'next/link'
import { getAgeColor, getBarrelAgeMonths } from '@/lib/tags'
import type { Barrel } from '@/types/database'

type ViewMode = 'age' | 'status' | 'mash_bill' | 'profile'

const statusColors: Record<string, string> = {
  aging: '#FAC775',
  ready: '#3B6D11',
  bottled: '#9c8a6a',
  dumped: '#A32D2D',
}

export function HeatMap({ barrels }: { barrels: Barrel[] }) {
  const [view, setView] = useState<ViewMode>('age')

  const rows = Array.from(new Set(barrels.map((b) => b.warehouse_row).filter(Boolean))).sort() as string[]
  const slots = Array.from(new Set(barrels.map((b) => b.warehouse_slot).filter(Boolean))).sort((a, b) => (a ?? 0) - (b ?? 0)) as number[]

  function getCellColor(barrel: Barrel | undefined): string {
    if (!barrel) return 'transparent'
    if (view === 'age') return getAgeColor(getBarrelAgeMonths(barrel.entry_date))
    if (view === 'status') return statusColors[barrel.status] || '#FAC775'
    if (view === 'profile') {
      const s = barrel.profile_match_score || 0
      const r = Math.round(255 - s * 1.2)
      const g = Math.round(60 + s * 1.4)
      return `rgb(${r},${g},0)`
    }
    return '#FAC775'
  }

  const barrelMap = new Map(barrels.map((b) => [`${b.warehouse_row}-${b.warehouse_slot}`, b]))

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {(['age', 'status', 'mash_bill', 'profile'] as ViewMode[]).map((m) => (
          <button
            key={m}
            onClick={() => setView(m)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-all min-h-[36px] ${
              view === m ? 'bg-primary text-white' : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
            }`}
          >
            {m === 'mash_bill' ? 'Mash Bill' : m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-max">
          <div className="flex gap-1 mb-1 pl-10">
            {slots.map((s) => (
              <div key={s} className="w-10 text-center text-xs text-[var(--color-text-muted)]">{s}</div>
            ))}
          </div>
          {rows.map((row) => (
            <div key={row} className="flex gap-1 mb-1 items-center">
              <div className="w-8 text-xs text-[var(--color-text-muted)] text-right pr-2">{row}</div>
              {slots.map((slot) => {
                const barrel = barrelMap.get(`${row}-${slot}`)
                const color = getCellColor(barrel)
                return barrel ? (
                  <Link key={slot} href={`/barrels/${barrel.id}`}>
                    <div
                      title={`${barrel.barrel_number}\n${barrel.mash_bill || ''}`}
                      className="w-10 h-10 rounded flex items-center justify-center text-[9px] font-medium cursor-pointer hover:opacity-80 transition-opacity border border-black/5"
                      style={{ backgroundColor: color }}
                    >
                      {barrel.barrel_number.slice(-3)}
                    </div>
                  </Link>
                ) : (
                  <div
                    key={slot}
                    className="w-10 h-10 rounded border border-dashed border-[var(--color-border)]"
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-muted)]">
        {view === 'age' && (
          <>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: '#EAF3DE' }} /> 0–12mo</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: '#FAEEDA' }} /> 13–24mo</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: '#FAC775' }} /> 25–36mo</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: '#EF9F27' }} /> 37–48mo</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded" style={{ background: '#D85A30' }} /> 48mo+</span>
          </>
        )}
        {view === 'status' && Object.entries(statusColors).map(([s, c]) => (
          <span key={s} className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded" style={{ background: c }} /> {s}
          </span>
        ))}
      </div>
    </div>
  )
}
