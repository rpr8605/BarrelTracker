'use client'
import { useEffect, useLayoutEffect, useState } from 'react'
import { useWalkthrough } from './WalkthroughProvider'

interface Rect {
  top: number
  left: number
  width: number
  height: number
}

const PADDING = 8
const TOOLTIP_W = 360
const TOOLTIP_GAP = 16

export function WalkthroughOverlay() {
  const { step, stepIndex, totalSteps, next, back, skip, end } = useWalkthrough()
  const [rect, setRect] = useState<Rect | null>(null)
  const [vw, setVw] = useState(0)
  const [vh, setVh] = useState(0)

  useEffect(() => {
    function measure() {
      setVw(window.innerWidth)
      setVh(window.innerHeight)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useLayoutEffect(() => {
    if (!step) return
    if (!step.targetSelector) {
      setRect(null)
      return
    }
    let attempts = 0
    function find() {
      const el = document.querySelector(step!.targetSelector!) as HTMLElement | null
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        // Wait a tick for scroll then measure
        setTimeout(() => {
          const r = el.getBoundingClientRect()
          setRect({ top: r.top, left: r.left, width: r.width, height: r.height })
        }, 300)
      } else if (attempts < 20) {
        attempts++
        setTimeout(find, 150)
      } else {
        // Target not found — fall back to center modal
        setRect(null)
      }
    }
    find()
  }, [step])

  if (!step) return null

  const isLast = stepIndex === totalSteps - 1
  const isCenter = step.placement === 'center' || !rect

  // Compute tooltip position
  let tipTop = vh / 2 - 140
  let tipLeft = vw / 2 - TOOLTIP_W / 2
  if (!isCenter && rect) {
    const above = rect.top > 240
    const below = vh - (rect.top + rect.height) > 240
    if (step.placement === 'top' || (step.placement !== 'bottom' && above)) {
      tipTop = rect.top - 200 - TOOLTIP_GAP
    } else if (step.placement === 'bottom' || below) {
      tipTop = rect.top + rect.height + TOOLTIP_GAP
    } else {
      tipTop = Math.max(20, rect.top)
    }
    if (step.placement === 'right') tipLeft = rect.left + rect.width + TOOLTIP_GAP
    else if (step.placement === 'left') tipLeft = rect.left - TOOLTIP_W - TOOLTIP_GAP
    else tipLeft = Math.min(vw - TOOLTIP_W - 16, Math.max(16, rect.left + rect.width / 2 - TOOLTIP_W / 2))
    tipTop = Math.max(16, Math.min(vh - 220, tipTop))
  }

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none">
      {/* Backdrop with optional spotlight cutout via SVG mask */}
      <svg className="absolute inset-0 w-full h-full pointer-events-auto" onClick={(e) => e.stopPropagation()}>
        <defs>
          <mask id="walkthrough-mask">
            <rect width="100%" height="100%" fill="white" />
            {rect && !isCenter && (
              <rect
                x={rect.left - PADDING}
                y={rect.top - PADDING}
                width={rect.width + PADDING * 2}
                height={rect.height + PADDING * 2}
                rx={12}
                ry={12}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect width="100%" height="100%" fill="rgba(15, 22, 30, 0.78)" mask="url(#walkthrough-mask)" />
      </svg>

      {/* Pulsing highlight ring around the target */}
      {rect && !isCenter && step.highlight && (
        <div
          className="absolute rounded-xl pointer-events-none animate-[pulse_1.6s_ease-in-out_infinite]"
          style={{
            top: rect.top - PADDING,
            left: rect.left - PADDING,
            width: rect.width + PADDING * 2,
            height: rect.height + PADDING * 2,
            boxShadow: '0 0 0 3px #BA7517, 0 0 32px rgba(186, 117, 23, 0.6)',
          }}
        />
      )}

      {/* Tooltip card */}
      <div
        className="absolute pointer-events-auto"
        style={{ top: tipTop, left: tipLeft, width: TOOLTIP_W, maxWidth: 'calc(100vw - 32px)' }}
      >
        <div className="rounded-2xl bg-[#1E2832] border-l-4 border-[#BA7517] shadow-2xl overflow-hidden">
          <div className="p-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-[#BA7517] mb-2">
              STEP {stepIndex + 1} OF {totalSteps}
            </div>
            <h3
              className="text-2xl text-[#BA7517] font-bold mb-3"
              style={{ fontFamily: 'Bebas Neue, Impact, sans-serif', letterSpacing: '0.02em' }}
            >
              {step.title}
            </h3>
            <p className="text-sm text-[#E8D5B0] leading-relaxed" style={{ fontFamily: 'Playfair Display, Georgia, serif' }}>
              {step.body}
            </p>
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-white/5 bg-[#252F3A]">
            <button
              onClick={skip}
              className="text-xs text-[#E8D5B0]/50 hover:text-[#E8D5B0] transition"
            >
              Skip tour
            </button>
            <div className="flex items-center gap-2">
              {stepIndex > 0 && (
                <button
                  onClick={back}
                  className="px-3 py-1.5 text-xs text-[#E8D5B0]/70 hover:text-white transition"
                >
                  Back
                </button>
              )}
              <button
                onClick={isLast ? end : next}
                className="px-4 py-1.5 rounded-lg bg-[#BA7517] text-white text-xs font-medium hover:bg-[#A6661A] active:scale-95 transition"
              >
                {isLast ? 'Finish' : 'Next →'}
              </button>
            </div>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-white/5">
            <div
              className="h-full bg-[#BA7517] transition-all"
              style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
