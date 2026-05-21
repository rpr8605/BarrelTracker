import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

type BadgeVariant = 'aging' | 'ready' | 'bottled' | 'dumped' | 'default' | 'success' | 'warning' | 'danger' | 'primary' | 'ghost'

const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold transition-colors'

const variants: Record<BadgeVariant, string> = {
  default: 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]',
  aging: 'badge-aging',
  ready: 'badge-ready',
  bottled: 'badge-bottled',
  dumped: 'badge-dumped',
  success: 'bg-green-500/10 text-green-500 border border-green-500/20',
  warning: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20',
  danger: 'bg-red-500/10 text-red-500 border border-red-500/20',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  ghost: 'bg-transparent border border-[var(--color-border)] text-[var(--color-text-secondary)]',
}

export function Badge({ 
  label, 
  children, 
  variant = 'default', 
  className 
}: { 
  label?: string
  children?: ReactNode
  variant?: BadgeVariant
  className?: string 
}) {
  return (
    <span className={cn(baseClasses, variants[variant], className)}>
      {label || children}
    </span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  const variant = status.toLowerCase() as BadgeVariant
  return <Badge label={label} variant={variants[variant] ? variant : 'default'} />
}

export function TagChip({ tag, onClick, amber }: { tag: string; onClick?: () => void; amber?: boolean }) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-default',
        amber
          ? 'bg-primary/10 text-primary'
          : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)]',
        onClick && 'cursor-pointer hover:opacity-80'
      )}
    >
      {tag}
    </span>
  )
}
