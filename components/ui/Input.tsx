import { InputHTMLAttributes, forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)
    return (
    <div className="space-y-1">
      {label && <label htmlFor={inputId} className="block text-sm font-medium text-[var(--color-text)]">{label}</label>}
      <input
        ref={ref}
        id={inputId}
        className={cn(
          'w-full px-3 py-2.5 rounded-lg border text-[var(--color-text)] bg-[var(--color-surface)] placeholder:text-[var(--color-text-muted)] text-sm outline-none transition-all min-h-[44px]',
          error
            ? 'border-danger focus:ring-1 focus:ring-danger'
            : 'border-[var(--color-border)] focus:border-primary focus:ring-1 focus:ring-primary/30',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--color-text-muted)]">{hint}</p>}
    </div>
  )
  }
)
Input.displayName = 'Input'

export function Select({ label, error, className, children, ...props }: InputHTMLAttributes<HTMLSelectElement> & { label?: string; error?: string }) {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm font-medium text-[var(--color-text)]">{label}</label>}
      <select
        className={cn(
          'w-full px-3 py-2.5 rounded-lg border text-[var(--color-text)] bg-[var(--color-surface)] text-sm outline-none transition-all min-h-[44px]',
          error ? 'border-danger' : 'border-[var(--color-border)] focus:border-primary focus:ring-1 focus:ring-primary/30',
          className
        )}
        {...(props as React.SelectHTMLAttributes<HTMLSelectElement>)}
      >
        {children}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  )
}

import React from 'react'
