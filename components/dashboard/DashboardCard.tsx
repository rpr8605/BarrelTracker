import { ReactNode } from 'react'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Metric {
  label: string
  value: string | number
  subValue?: string
}

interface Highlight {
  label: string
  status: 'green' | 'yellow' | 'red'
}

interface DashboardCardProps {
  title: string
  metrics: Metric[]
  highlight?: Highlight
  actionLabel: string
  onAction?: () => void
  href?: string
  className?: string
}

export function DashboardCard({
  title,
  metrics,
  highlight,
  actionLabel,
  onAction,
  href,
  className
}: DashboardCardProps) {
  const content = (
    <>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-[#222] mb-4">
        <h3 className="text-sm font-bold tracking-widest text-white uppercase">{title}</h3>
        {highlight && (
          <div className={cn(
            "h-2 w-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.5)]",
            highlight.status === 'green' ? 'bg-green-500 shadow-green-500/50' :
            highlight.status === 'yellow' ? 'bg-amber-500 shadow-amber-500/50' :
            'bg-red-500 shadow-red-500/50'
          )} />
        )}
      </CardHeader>
      
      <div className="flex-1 space-y-6">
        <div className="grid grid-cols-2 gap-x-4 gap-y-6">
          {metrics.map((metric, i) => (
            <div key={i} className="space-y-1">
              <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-medium">{metric.label}</p>
              <div className="flex items-baseline gap-1.5">
                <p className="text-xl font-bold text-zinc-100">{metric.value}</p>
                {metric.subValue && (
                  <p className="text-[10px] text-zinc-400 font-medium">{metric.subValue}</p>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {highlight && (
          <div className={cn(
            "p-3 rounded-lg text-xs font-semibold flex items-center gap-2",
            highlight.status === 'green' ? 'bg-green-500/5 text-green-400 border border-green-500/10' :
            highlight.status === 'yellow' ? 'bg-amber-500/5 text-amber-500 border border-amber-500/10' :
            'bg-red-500/5 text-red-400 border border-red-500/10'
          )}>
            <div className={cn(
              "w-1.5 h-1.5 rounded-full shrink-0",
              highlight.status === 'green' ? 'bg-green-500' :
              highlight.status === 'yellow' ? 'bg-amber-500' :
              'bg-red-500'
            )} />
            {highlight.label}
          </div>
        )}
      </div>

      <div className="mt-8">
        {href ? (
          <Link href={href} className="block w-full">
            <Button 
              variant="secondary" 
              className="w-full justify-between group bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white"
            >
              <span>{actionLabel}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        ) : (
          <Button 
            variant="secondary" 
            className="w-full justify-between group bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white"
            onClick={onAction}
          >
            <span>{actionLabel}</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Button>
        )}
      </div>
    </>
  )

  return (
    <Card className={cn("flex flex-col h-full bg-[#121212] border-[#222] hover:border-primary/50 transition-colors", className)}>
      {content}
    </Card>
  )
}
