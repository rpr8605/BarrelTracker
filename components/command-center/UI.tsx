import { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export function CommandCard({ title, children, className, headerAction }: { title?: string, children: ReactNode, className?: string, headerAction?: ReactNode }) {
  return (
    <div className={cn("bg-[#0f0f0f] border border-[#222222] rounded-xl overflow-hidden", className)}>
      {title && (
        <div className="px-4 py-3 border-b border-[#222222] flex items-center justify-between bg-[#141414]/50">
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#666666]">{title}</h3>
          {headerAction}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  )
}

export function CommandMetric({ label, value, change, trend }: { label: string, value: string | number, change?: number, trend?: 'up' | 'down' | 'neutral' }) {
  return (
    <CommandCard className="flex flex-col justify-between h-32">
      <p className="text-xs font-medium text-[#666666] uppercase tracking-wider">{label}</p>
      <div className="mt-auto">
        <h2 className="text-3xl font-bold tracking-tight">{value}</h2>
        {change !== undefined && (
          <div className={cn(
            "text-[10px] font-bold mt-1 flex items-center gap-1",
            trend === 'up' ? "text-green-500" : trend === 'down' ? "text-red-500" : "text-[#666666]"
          )}>
            {trend === 'up' ? '▲' : trend === 'down' ? '▼' : '■'}
            {Math.abs(change)}% vs last month
          </div>
        )}
      </div>
    </CommandCard>
  )
}

export function CommandBadge({ variant = 'default', children }: { variant?: 'default' | 'success' | 'warning' | 'danger' | 'primary', children: ReactNode }) {
  const styles = {
    default: "bg-[#222222] text-[#a0a0a0]",
    success: "bg-green-500/10 text-green-500 border border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-500 border border-yellow-500/20",
    danger: "bg-red-500/10 text-red-500 border border-red-500/20",
    primary: "bg-[#BA7517]/10 text-[#BA7517] border border-[#BA7517]/20"
  }
  
  return (
    <span className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-tight", styles[variant])}>
      {children}
    </span>
  )
}

export function CommandTable({ headers, children }: { headers: string[], children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-[#222222]">
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-[10px] uppercase tracking-widest text-[#666666] font-bold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#222222]/50">
          {children}
        </tbody>
      </table>
    </div>
  )
}
