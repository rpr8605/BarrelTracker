'use client'
import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { WALKTHROUGH_STEPS, type WalkthroughStep } from '@/lib/walkthrough/steps'
import { getWalkthroughState, saveWalkthroughProgress } from '@/lib/walkthrough/storage'
import { WalkthroughOverlay } from './WalkthroughOverlay'

interface WalkthroughContextValue {
  active: boolean
  stepIndex: number
  step: WalkthroughStep | null
  totalSteps: number
  start: () => void
  next: () => void
  back: () => void
  skip: () => void
  end: () => void
  dismissed: boolean
  completed: boolean
}

const WalkthroughContext = createContext<WalkthroughContextValue | null>(null)

export function useWalkthrough() {
  const ctx = useContext(WalkthroughContext)
  if (!ctx) throw new Error('useWalkthrough must be used within WalkthroughProvider')
  return ctx
}

export function WalkthroughProvider({
  userId,
  autoStart,
  children,
}: {
  userId: string | null
  autoStart: boolean
  children: ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [active, setActive] = useState(false)
  const [stepIndex, setStepIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const [completed, setCompleted] = useState(false)
  const hasInit = useRef(false)

  useEffect(() => {
    if (!userId || hasInit.current) return
    hasInit.current = true
    ;(async () => {
      const state = await getWalkthroughState(userId)
      if (state?.completedAt) setCompleted(true)
      if (state?.dismissedAt) setDismissed(true)
      if (state?.currentStep) setStepIndex(state.currentStep)
      if (autoStart && !state?.completedAt && !state?.dismissedAt) {
        // Stagger to allow page render
        setTimeout(() => setActive(true), 400)
      }
    })()
  }, [userId, autoStart])

  const persist = useCallback(
    async (payload: Parameters<typeof saveWalkthroughProgress>[1]) => {
      if (!userId) return
      try { await saveWalkthroughProgress(userId, payload) } catch {}
    },
    [userId],
  )

  const step: WalkthroughStep | null = active ? WALKTHROUGH_STEPS[stepIndex] ?? null : null

  // Navigate to the step's target route if needed
  useEffect(() => {
    if (!active || !step) return
    if (step.action && pathname !== step.action) {
      router.push(step.action)
    }
  }, [active, step, pathname, router])

  const start = useCallback(() => {
    setStepIndex(0)
    setActive(true)
    setDismissed(false)
    persist({ current_step: 0, dismissed_at: null })
  }, [persist])

  const next = useCallback(() => {
    setStepIndex((i) => {
      const ni = Math.min(WALKTHROUGH_STEPS.length - 1, i + 1)
      persist({ current_step: ni, completed_steps: Array.from({ length: ni + 1 }, (_, k) => k) })
      if (ni === WALKTHROUGH_STEPS.length - 1) {
        // Don't auto-end; let "Finish" button close.
      }
      return ni
    })
  }, [persist])

  const back = useCallback(() => {
    setStepIndex((i) => {
      const ni = Math.max(0, i - 1)
      persist({ current_step: ni })
      return ni
    })
  }, [persist])

  const skip = useCallback(() => {
    setActive(false)
    setDismissed(true)
    persist({ dismissed_at: new Date().toISOString() })
  }, [persist])

  const end = useCallback(() => {
    setActive(false)
    setCompleted(true)
    persist({ completed_at: new Date().toISOString(), current_step: WALKTHROUGH_STEPS.length - 1 })
  }, [persist])

  return (
    <WalkthroughContext.Provider
      value={{
        active,
        stepIndex,
        step,
        totalSteps: WALKTHROUGH_STEPS.length,
        start,
        next,
        back,
        skip,
        end,
        dismissed,
        completed,
      }}
    >
      {children}
      {active && step && <WalkthroughOverlay />}
    </WalkthroughContext.Provider>
  )
}
