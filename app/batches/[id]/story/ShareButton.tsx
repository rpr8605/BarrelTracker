'use client'
import { useState } from 'react'

export function ShareButton() {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copy}
      className="text-xs px-4 py-2 rounded-full border border-[#BA7517]/40 text-[#c9b48a] hover:border-[#BA7517] hover:text-[#BA7517] transition-colors"
    >
      {copied ? 'Copied!' : 'Share this batch'}
    </button>
  )
}
