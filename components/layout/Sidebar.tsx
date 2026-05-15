'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import { DistillerySwitcher } from './DistillerySwitcher'
import { TourTrigger } from '@/components/walkthrough/TourTrigger'

const nav: Array<{ href: string; label: string; icon: string; alertKey?: boolean; tour?: string }> = [
  { href: '/dashboard', label: 'Dashboard', icon: '⌂', tour: 'dashboard-nav' },
  { href: '/barrels', label: 'Barrels', icon: '⬡', tour: 'barrels-nav' },
  { href: '/search', label: 'Search', icon: '◎' },
  { href: '/warehouse', label: 'Warehouse', icon: '▦' },
  { href: '/blend', label: 'Blending', icon: '⟳' },
  { href: '/profile', label: 'Taste Profile', icon: '◈' },
  { href: '/suggestions', label: 'Suggestions', icon: '✦' },
  { href: '/batches', label: 'Batches', icon: '▣' },
  { href: '/production', label: 'Production', icon: '⟿' },
  { href: '/processing', label: 'Processing', icon: '⊡' },
  { href: '/sponsorships', label: 'Sponsorships', icon: '★', tour: 'sponsorship-tiers' },
  { href: '/compliance', label: 'Compliance', icon: '✓', alertKey: true, tour: 'ttb-compliance-nav' },
  { href: '/compliance/calendar', label: 'Cal. Deadlines', icon: '◷' },
  { href: '/compliance/permits', label: 'Permits', icon: '◉' },
  { href: '/tax', label: 'Excise Tax', icon: '⊕' },
  { href: '/products', label: 'Products', icon: '⊞' },
  { href: '/analytics', label: 'Analytics', icon: '↗' },
  { href: '/settings', label: 'Settings', icon: '⚙' },
]

interface Distillery { id: string; name: string }

export function Sidebar({
  distilleryName,
  allDistilleries = [],
  activeDistilleryId,
}: {
  distilleryName?: string
  allDistilleries?: Distillery[]
  activeDistilleryId?: string
}) {
  const path = usePathname()
  const [alertCount, setAlertCount] = useState(0)

  useEffect(() => {
    if (!activeDistilleryId) return
    fetch(`/api/compliance/amendment-alerts?distillery_id=${activeDistilleryId}&status=pending&count=true`)
      .then((r) => r.json())
      .then((d) => setAlertCount(d.count ?? 0))
      .catch(() => {})
  }, [activeDistilleryId])

  return (
    <aside className="hidden md:flex flex-col w-56 min-h-screen border-r border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-6">
        <div className="text-xl font-medium text-primary">Still</div>
        {distilleryName && (
          <div className="text-xs text-[var(--color-text-muted)] mt-0.5 truncate">{distilleryName}</div>
        )}
        {allDistilleries.length > 1 && activeDistilleryId && (
          <DistillerySwitcher distilleries={allDistilleries} activeId={activeDistilleryId} />
        )}
      </div>

      <nav className="flex-1 space-y-0.5">
        {nav.map(({ href, label, icon, alertKey, tour }) => (
          <Link
            key={href}
            href={href}
            data-tour={tour}
            className={cn(
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-all min-h-[44px]',
              path === href || (href !== '/compliance' && path.startsWith(href + '/'))
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-secondary)] hover:text-[var(--color-text)]'
            )}
          >
            <span className="w-4 text-center">{icon}</span>
            <span className="flex-1">{label}</span>
            {alertKey && alertCount > 0 && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold leading-none">
                {alertCount > 9 ? '9+' : alertCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="pt-4 border-t border-[var(--color-border)] space-y-2">
        <TourTrigger />
        <Link
          href="/barrels/new"
          data-tour="add-barrel-button"
          className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-primary text-white text-sm font-medium hover:bg-primary-dark transition-all min-h-[44px]"
        >
          + Log Barrel
        </Link>
      </div>
    </aside>
  )
}
