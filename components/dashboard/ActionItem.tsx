import { cn } from '@/lib/utils'
import { AlertCircle, Clock, CheckCircle2, ChevronRight, Info } from 'lucide-react'
import Link from 'next/link'

export type ActionSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info'

interface ActionItemProps {
  id: string
  title: string
  description?: string
  severity: ActionSeverity
  module: string
  dueAt?: string
  href?: string
}

const severityConfig = {
  critical: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10' },
  high: { icon: AlertCircle, color: 'text-orange-500', bg: 'bg-orange-500/10' },
  medium: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  low: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  info: { icon: Info, color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
}

export function ActionItem({ id, title, description, severity, module, dueAt, href }: ActionItemProps) {
  const config = severityConfig[severity] || severityConfig.info
  const Icon = config.icon

  const content = (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-zinc-900/50 border border-zinc-800 hover:border-zinc-700 transition-colors group">
      <div className={cn("mt-0.5 p-1.5 rounded-md", config.bg)}>
        <Icon className={cn("w-4 h-4", config.color)} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-100 truncate">{title}</p>
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-1.5 py-0.5 rounded border border-zinc-800 bg-zinc-950">
            {module}
          </span>
        </div>
        {description && (
          <p className="text-xs text-zinc-400 mt-1 line-clamp-1">{description}</p>
        )}
        {dueAt && (
          <p className="text-[10px] text-zinc-500 mt-2 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Due {new Date(dueAt).toLocaleDateString()}
          </p>
        )}
      </div>

      <ChevronRight className="w-4 h-4 text-zinc-600 mt-2 group-hover:text-zinc-400 transition-colors" />
    </div>
  )

  if (href) {
    return (
      <Link href={href} className="block no-underline">
        {content}
      </Link>
    )
  }

  return content
}
