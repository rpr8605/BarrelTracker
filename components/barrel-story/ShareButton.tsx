'use client'
import { useState } from 'react'

interface Props {
  token: string
  barrelNumber: string
  distilleryName: string
}

export function ShareButton({ token, barrelNumber, distilleryName }: Props) {
  const [copied, setCopied] = useState(false)
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/barrel/${token}`
  const caption = `Just found Barrel #${barrelNumber} at ${distilleryName} — aging and counting. ${url} #StillApp #CraftWhiskey`

  async function share() {
    if (navigator.share) {
      try {
        await navigator.share({ title: `Barrel #${barrelNumber}`, text: caption, url })
        return
      } catch {}
    }
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={share}
      className="w-full py-3 rounded-xl border border-white/20 text-sm font-medium text-white hover:bg-white/5 transition-all min-h-[48px]"
    >
      {copied ? '✓ Link copied' : 'Share this barrel'}
    </button>
  )
}
