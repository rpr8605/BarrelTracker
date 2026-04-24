'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: '⌂' },
  { href: '/barrels', label: 'Barrels', icon: '⬡' },
  { href: '/search', label: 'Search', icon: '◎' },
  { href: '/warehouse', label: 'Warehouse', icon: '▦' },
  { href: '/blend', label: 'Blending', icon: '⟳' },
  { href: '/profile', label: 'Taste Profile', icon: '◈' },
  { href: '/suggestions', label: 'Suggestions', icon: '✦' },
  { href: '/batches', label: 'Batches', icon: '▣' },
  { href: '/compliance', label: 'Compliance', icon: '✓' },
  { href: '/analytics', label: 'Analytics', icon: '↗' },
]

export function Sidebar({ distilleryName }: { distilleryName?: string }) {
  const path = usePathname()

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-6">
        <div className="text-xl font-medium text-primary">Still</div>
        {distilleryName && (
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{distilleryName}</div>
        )}
      </div>

      <nav className="flex-1 space-y-0.5">
        {nav.map(({ href, label, icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all min-h-[44px]',
              path === href
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]'
            )}
          >
            <span className="w-4 text-center">{icon}</span>
            {label}
          </Link>
        ))}
      </nav>

      <div className="pt-4 border-t border-[var(--color-border)]">
        <Link href="/barrels/new" className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-all min-h-[44px]">
          + Log Barrel
        </Link>
      </div>
    </aside>
  )
}
