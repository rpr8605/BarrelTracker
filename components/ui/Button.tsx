'use client'
import { ReactNode, ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  children: ReactNode
}

export function Button({ variant = 'primary', size = 'md', loading, className, children, disabled, ...props }: ButtonProps) {
  const base = 'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed'

  const variants = {
    primary: 'bg-primary text-white hover:bg-primary-dark active:scale-95',
    secondary: 'border border-[var(--color-border)] text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)] active:scale-95',
    ghost: 'text-[var(--color-text-secondary)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg-secondary)]',
    danger: 'bg-danger text-white hover:opacity-90 active:scale-95',
  }

  const sizes = {
    sm: 'px-3 py-1.5 text-sm min-h-[36px]',
    md: 'px-4 py-2 text-sm min-h-[44px]',
    lg: 'px-6 py-3 text-base min-h-[52px]',
  }

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  )
}
