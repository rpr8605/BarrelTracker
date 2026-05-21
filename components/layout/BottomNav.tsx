'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'

const nav = [
  { href: '/dashboard', label: 'Home', icon: '⌂' },
  { href: '/barrels', label: 'Barrels', icon: '⬡' },
  { href: '/barrels/new', label: '', icon: '+' },
  { href: '/compliance', label: 'Compliance', icon: '✓' },
  { href: '/more', label: 'More', icon: '☰' },
]

export function BottomNav() {
  const path = usePathname()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-surface)] border-t border-[var(--color-border)] bottom-nav z-40">
      <div className="flex items-center justify-around px-2 py-1">
        {nav.map(({ href, label, icon }) => {
          const isAdd = href === '/barrels/new'
          const active = path === href

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[56px]',
                isAdd
                  ? 'mx-2'
                  : active
                  ? 'text-primary'
                  : 'text-[var(--color-text-muted)]'
              )}
            >
              {isAdd ? (
                <span className="w-12 h-12 flex items-center justify-center bg-primary text-white rounded-full text-2xl font-light shadow-lg">
                  +
                </span>
              ) : (
                <>
                  <span className="text-lg leading-none">{icon}</span>
                  <span className="text-[10px]">{label}</span>
                </>
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
