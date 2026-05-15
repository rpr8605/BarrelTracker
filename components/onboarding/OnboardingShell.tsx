'use client'
import { ReactNode } from 'react'
import { STEP_LABELS, type OnboardingStep } from '@/lib/onboarding/schema'

export function OnboardingShell({
  step,
  title,
  intro,
  children,
}: {
  step: OnboardingStep
  title: string
  intro?: string
  children: ReactNode
}) {
  const stepNums: OnboardingStep[] = [1, 2, 3, 4, 5]
  return (
    <div className="min-h-screen bg-[#1E2832] text-[#E8D5B0] flex flex-col">
      <div className="w-full max-w-3xl mx-auto px-4 md:px-8 py-8 md:py-12 flex-1 flex flex-col">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-6">
            {stepNums.map((n, i) => (
              <div key={n} className="flex items-center gap-2 flex-1">
                <div
                  className={`w-8 h-8 rounded-full grid place-items-center text-xs font-semibold border-2 transition-all ${
                    n < step
                      ? 'bg-[#BA7517] border-[#BA7517] text-white'
                      : n === step
                      ? 'bg-[#BA7517]/10 border-[#BA7517] text-[#BA7517]'
                      : 'border-white/15 text-white/30'
                  }`}
                >
                  {n < step ? '✓' : n}
                </div>
                {i < stepNums.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 transition-all ${
                      n < step ? 'bg-[#BA7517]' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="text-xs uppercase tracking-widest text-[#BA7517] font-mono">
            STEP {step} OF 5 · {STEP_LABELS[step]}
          </div>
          <h1
            className="mt-2 text-3xl md:text-4xl font-bold text-white"
            style={{ fontFamily: 'Playfair Display, Georgia, serif' }}
          >
            {title}
          </h1>
          {intro && (
            <p className="mt-3 text-sm md:text-base text-[#E8D5B0]/70 leading-relaxed max-w-2xl">
              {intro}
            </p>
          )}
        </div>
        <div className="flex-1">{children}</div>
      </div>
    </div>
  )
}

export function FormCard({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={`bg-[#252F3A] rounded-2xl p-5 md:p-6 border border-white/5 ${className ?? ''}`}
    >
      {children}
    </div>
  )
}

export function FieldGrid({ children, cols = 2 }: { children: ReactNode; cols?: 1 | 2 | 3 }) {
  const grid = { 1: 'grid-cols-1', 2: 'grid-cols-1 md:grid-cols-2', 3: 'grid-cols-1 md:grid-cols-3' }[cols]
  return <div className={`grid ${grid} gap-4`}>{children}</div>
}

export function TextField({
  label,
  value,
  onChange,
  required,
  hint,
  type = 'text',
  placeholder,
  className,
}: {
  label: string
  value: string | number | undefined
  onChange: (v: string) => void
  required?: boolean
  hint?: string
  type?: string
  placeholder?: string
  className?: string
}) {
  return (
    <div className={`space-y-1 ${className ?? ''}`}>
      <label className="block text-xs font-medium text-[#E8D5B0]/80">
        {label} {required && <span className="text-[#BA7517]">*</span>}
      </label>
      <input
        type={type}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 rounded-lg bg-[#1E2832] border border-white/10 text-white placeholder:text-white/30 text-sm outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/40 min-h-[44px]"
      />
      {hint && <p className="text-[11px] text-[#E8D5B0]/40">{hint}</p>}
    </div>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required,
}: {
  label: string
  value: string | undefined
  onChange: (v: string) => void
  options: Array<{ value: string; label: string }>
  required?: boolean
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-[#E8D5B0]/80">
        {label} {required && <span className="text-[#BA7517]">*</span>}
      </label>
      <select
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg bg-[#1E2832] border border-white/10 text-white text-sm outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/40 min-h-[44px]"
      >
        <option value="">— Select —</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  rows = 3,
  maxLength,
  hint,
}: {
  label: string
  value: string | undefined
  onChange: (v: string) => void
  rows?: number
  maxLength?: number
  hint?: string
}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs font-medium text-[#E8D5B0]/80">{label}</label>
      <textarea
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        maxLength={maxLength}
        className="w-full px-3 py-2.5 rounded-lg bg-[#1E2832] border border-white/10 text-white placeholder:text-white/30 text-sm outline-none focus:border-[#BA7517] focus:ring-1 focus:ring-[#BA7517]/40"
      />
      {hint && <p className="text-[11px] text-[#E8D5B0]/40">{hint}</p>}
    </div>
  )
}

export function CheckboxGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string
  options: Array<{ value: string; label: string }>
  value: string[]
  onChange: (v: string[]) => void
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-[#E8D5B0]/80">{label}</label>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
        {options.map((o) => {
          const checked = value.includes(o.value)
          return (
            <label
              key={o.value}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition ${
                checked
                  ? 'border-[#BA7517] bg-[#BA7517]/10 text-white'
                  : 'border-white/10 bg-[#1E2832] text-[#E8D5B0]/70'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() =>
                  onChange(checked ? value.filter((x) => x !== o.value) : [...value, o.value])
                }
                className="accent-[#BA7517]"
              />
              <span>{o.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export function Toggle({
  label,
  value,
  onChange,
  hint,
}: {
  label: string
  value: boolean
  onChange: (v: boolean) => void
  hint?: string
}) {
  return (
    <label className="flex items-center justify-between gap-4 cursor-pointer">
      <div>
        <div className="text-sm text-white">{label}</div>
        {hint && <div className="text-xs text-[#E8D5B0]/40">{hint}</div>}
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative w-11 h-6 rounded-full transition ${
          value ? 'bg-[#BA7517]' : 'bg-white/15'
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition ${
            value ? 'left-[22px]' : 'left-0.5'
          }`}
        />
      </button>
    </label>
  )
}

export function NavRow({
  onBack,
  onNext,
  onSkip,
  nextLabel = 'Continue',
  nextDisabled,
  loading,
}: {
  onBack?: () => void
  onNext: () => void
  onSkip?: () => void
  nextLabel?: string
  nextDisabled?: boolean
  loading?: boolean
}) {
  return (
    <div className="mt-8 flex items-center justify-between gap-3">
      <div className="flex gap-2">
        {onBack && (
          <button
            onClick={onBack}
            type="button"
            className="px-4 py-2 text-sm text-[#E8D5B0]/70 hover:text-white transition"
          >
            ← Back
          </button>
        )}
      </div>
      <div className="flex gap-2 items-center">
        {onSkip && (
          <button
            onClick={onSkip}
            type="button"
            className="px-4 py-2 text-sm text-[#E8D5B0]/50 hover:text-[#E8D5B0]/80 transition"
          >
            Skip for now
          </button>
        )}
        <button
          onClick={onNext}
          type="button"
          disabled={nextDisabled || loading}
          className="px-6 py-2.5 rounded-lg bg-[#BA7517] text-white font-medium text-sm hover:bg-[#A6661A] active:scale-95 transition disabled:opacity-40 disabled:cursor-not-allowed min-h-[44px]"
        >
          {loading ? 'Saving…' : nextLabel}
        </button>
      </div>
    </div>
  )
}
