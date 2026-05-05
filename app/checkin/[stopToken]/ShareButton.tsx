'use client'

interface ShareButtonProps {
  stopName: string
  trailId: string
}

export function ShareButton({ stopName, trailId }: ShareButtonProps) {
  function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator.share({
        title: `I visited ${stopName}!`,
        text: `Just checked in at ${stopName} on the Veterans Whiskey Trail 🎖️`,
        url: window.location.href,
      }).catch(() => {})
    } else {
      // Fallback: copy to clipboard
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).catch(() => {})
      }
    }
  }

  return (
    <button
      onClick={handleShare}
      className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[#BA7517] text-white text-sm font-medium hover:bg-[#854F0B] transition-colors active:scale-95"
    >
      Share Visit
    </button>
  )
}
