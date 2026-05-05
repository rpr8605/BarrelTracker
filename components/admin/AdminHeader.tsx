'use client'
interface Props {
  adminName: string
  viewingAsName?: string
  viewingAsId?: string
}

export function AdminHeader({ adminName, viewingAsName }: Props) {
  return (
    <header className="h-14 border-b border-[var(--color-border)] bg-[var(--color-surface)] flex items-center justify-between px-6">
      <div className="text-sm font-medium text-[var(--color-text)]">Admin — {adminName}</div>
      {viewingAsName && (
        <div className="text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full">
          Viewing: {viewingAsName}
        </div>
      )}
    </header>
  )
}
