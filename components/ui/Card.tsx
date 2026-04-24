import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function Card({ children, className, onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      className={cn('card p-4', onClick && 'cursor-pointer hover:shadow-md transition-shadow', className)}
      onClick={onClick}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mb-3', className)}>{children}</div>
}
