'use client'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import type { Distillery } from '@/types/database'

interface DistillerySwitcherProps {
  activeId: string | null
  onSwitch: (id: string) => void
}

export function DistillerySwitcher({ activeId, onSwitch }: DistillerySwitcherProps) {
  const [distilleries, setDistilleries] = useState<Distillery[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase.from('distilleries').select('*').eq('owner_id', user.id).then(({ data }) => {
        setDistilleries((data || []) as Distillery[])
      })
    })
  }, [])

  if (distilleries.length <= 1) return null

  const active = distilleries.find((d) => d.id === activeId) || distilleries[0]

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors min-h-[36px] w-full"
      >
        <span className="truncate">{active?.name}</span>
        <span className="text-xs opacity-60">▾</span>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-48 card shadow-lg z-20 overflow-hidden">
            {distilleries.map((d) => (
              <button
                key={d.id}
                onClick={() => { onSwitch(d.id); setOpen(false) }}
                className={`w-full text-left px-3 py-2.5 text-sm transition-colors min-h-[44px] ${
                  d.id === activeId
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
