'use client'

export function BarrelQRCode({ barrelId, barrelNumber }: { barrelId: string; barrelNumber: string }) {
  const url = `/api/barrels/${barrelId}/qr`

  return (
    <div className="flex flex-col items-center gap-2">
      <img
        src={url}
        alt={`QR code for ${barrelNumber}`}
        className="w-32 h-32 rounded-lg border border-[var(--color-border)]"
      />
      <a
        href={url}
        download={`barrel-${barrelNumber}.png`}
        className="text-xs text-primary hover:underline min-h-[32px] flex items-center"
      >
        Download QR
      </a>
    </div>
  )
}
