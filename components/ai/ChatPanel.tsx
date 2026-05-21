'use client'
import { useState, useEffect } from 'react'
import { AskStillSidebar } from './AskStillSidebar'

export function ChatPanel() {
  const [open, setOpen] = useState(false)

  // Listen for custom event to open from dashboard
  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener('open-assistant', handleOpen)
    return () => window.removeEventListener('open-assistant', handleOpen)
  }, [])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all flex items-center justify-center text-xl"
        aria-label="Open assistant"
      >
        ✦
      </button>

      <AskStillSidebar isOpen={open} onClose={() => setOpen(false)} />
    </>
  )
}
