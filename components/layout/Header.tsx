'use client'
import { usePathname } from 'next/navigation'

const titles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/barrels': 'Barrels',
  '/search': 'Search',
  '/warehouse': 'Warehouse',
  '/blend': 'Blending',
  '/profile': 'Taste Profile',
  '/suggestions': 'AI Suggestions',
  '/batches': 'Batches',
  '/compliance': 'Compliance',
  '/analytics': 'Analytics',
  '/barrels/new': 'Log Barrel',
}

export function Header({ distilleryName }: { distilleryName?: string }) {
  const path = usePathname()
  const title = titles[path] || 'Still'

  return (
    <header className="md:hidden sticky top-0 z-30 bg-[var(--color-surface)] border-b border-[var(--color-border)] px-4 py-3 flex items-center justify-between">
      <div>
        <h1 className="font-medium text-[var(--color-text)]">{title}</h1>
        {distilleryName && <p className="text-xs text-[var(--color-text-muted)]">{distilleryName}</p>}
      </div>
      <span className="text-xl font-medium text-primary">Still</span>
    </header>
  )
}
