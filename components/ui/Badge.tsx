import { cn } from '@/lib/utils'

type BadgeVariant = 'aging' | 'ready' | 'bottled' | 'dumped' | 'default'

export function Badge({ label, variant = 'default', className }: { label: string; variant?: BadgeVariant; className?: string }) {
  const variantClass = variant !== 'default' ? `badge-${variant}` : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)]'
  return (
    <span className={cn('badge', variantClass, className)}>{label}</span>
  )
}

export function StatusBadge({ status }: { status: string }) {
  const label = status.charAt(0).toUpperCase() + status.slice(1)
  const variant = status as BadgeVariant
  return <Badge label={label} variant={variant} />
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
