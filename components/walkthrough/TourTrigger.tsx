'use client'
import { useWalkthrough } from './WalkthroughProvider'

export function TourTrigger() {
  const { start, completed, dismissed } = useWalkthrough()
  const label = completed ? 'Replay tour' : dismissed ? 'Resume tour' : 'Take the tour'
  return (
    <button
      type="button"
      onClick={start}
      data-tour="nav-tour-button"
      className="flex items-center justify-center gap-2 w-full py-2 rounded-lg border border-[#BA7517]/30 text-[#BA7517] text-xs font-medium hover:bg-[#BA7517]/10 transition min-h-[36px]"
    >
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M16 8l-4 4-4-4M12 12v6" />
      </svg>
      {label}
    </button>
  )
}
