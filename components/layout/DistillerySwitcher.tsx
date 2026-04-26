'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Distillery { id: string; name: string }

export function DistillerySwitcher({ distilleries, activeId }: { distilleries: Distillery[]; activeId: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [switching, setSwitching] = useState(false)

  if (distilleries.length <= 1) return null

  const active = distilleries.find((d) => d.id === activeId) || distilleries[0]

  async function switchTo(id: string) {
    if (id === activeId) { setOpen(false); return }
    setSwitching(true)
    setOpen(false)
    await fetch('/api/distillery/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ distilleryId: id }),
    })
    router.refresh()
    setSwitching(false)
  }

  return (
    <div className="relative mt-1">
      <button
        onClick={() => setOpen(!open)}
        disabled={switching}
        className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors w-full min-h-[28px] disabled:opacity-60"
      >
        <span className="truncate">{switching ? 'Switching...' : active?.name}</span>
        <span className="opacity-50 ml-auto">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-48 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg shadow-lg z-20 overflow-hidden">
            {distilleries.map((d) => (
              <button
                key={d.id}
                onClick={() => switchTo(d.id)}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors min-h-[44px] ${
                  d.id === activeId
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                {d.name}
                {d.id === activeId && <span className="ml-1 text-xs">✓</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
