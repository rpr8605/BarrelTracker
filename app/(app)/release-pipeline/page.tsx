'use client'

import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Rocket, 
  MoreHorizontal, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  Calendar
} from 'lucide-react'

const LANES = [
  'Planned',
  'Barrel Selection',
  'Blend Draft',
  'Final Tasting',
  'Proof Target',
  'Label/COLA',
  'Bottling Ready'
]

const RELEASES = [
  {
    id: '1',
    name: 'Spring Single Barrel',
    lane: 'Barrel Selection',
    value: '$42,500',
    bottles: '240',
    blockers: ['Lab results pending'],
    type: 'Bourbon',
    date: 'Apr 2024'
  },
  {
    id: '2',
    name: "Founder's Rye",
    lane: 'Label/COLA',
    value: '$125,000',
    bottles: '1,200',
    blockers: [],
    type: 'Rye',
    date: 'May 2024'
  },
  {
    id: '3',
    name: 'Toasted Oak Finish',
    lane: 'Blend Draft',
    value: '$68,000',
    bottles: '450',
    blockers: ['Secondary finish check'],
    type: 'Bourbon',
    date: 'June 2024'
  },
  {
    id: '4',
    name: 'Winter Reserve',
    lane: 'Planned',
    value: '$210,000',
    bottles: '2,400',
    blockers: [],
    type: 'Special',
    date: 'Nov 2024'
  }
]

export default function ReleasePipelinePage() {
  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6 overflow-hidden">
      <header className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Release Pipeline</h1>
          <p className="text-[var(--color-text-muted)] text-sm">Hearth & Hollow · Commercialization Roadmap</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm">Pipeline Settings</Button>
          <Button size="sm">New Release</Button>
        </div>
      </header>

      <div className="flex-1 overflow-x-auto pb-4">
        <div className="flex gap-4 h-full min-w-max">
          {LANES.map((lane) => (
            <div key={lane} className="w-80 flex flex-col gap-3 bg-[var(--color-bg-secondary)]/30 p-3 rounded-xl border border-[var(--color-border)]/50">
              <div className="flex items-center justify-between px-2">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[var(--color-text-muted)] flex items-center gap-2">
                  {lane}
                  <Badge className="bg-[var(--color-border)] text-[var(--color-text-secondary)] text-[10px]">
                    {RELEASES.filter(r => r.lane === lane).length}
                  </Badge>
                </h3>
                <MoreHorizontal className="w-4 h-4 text-[var(--color-text-muted)]" />
              </div>

              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {RELEASES.filter((r) => r.lane === lane).map((release) => (
                  <Card key={release.id} className="p-3 border-[var(--color-border)] hover:border-primary/50 transition-colors shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="ghost" className="text-[10px] bg-primary/10 text-primary">
                        {release.type}
                      </Badge>
                      <span className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {release.date}
                      </span>
                    </div>
                    <h4 className="font-bold text-sm mb-3">{release.name}</h4>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--color-text-muted)]">Proj. Value</span>
                        <span className="font-semibold text-green-400">{release.value}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--color-text-muted)]">Vol. (Bottles)</span>
                        <span>{release.bottles}</span>
                      </div>
                    </div>

                    {release.blockers.length > 0 && (
                      <div className="mt-3 p-2 bg-red-500/10 border border-red-500/20 rounded flex items-start gap-2">
                        <AlertTriangle className="w-3 h-3 text-red-400 mt-0.5" />
                        <span className="text-[10px] text-red-200">{release.blockers[0]}</span>
                      </div>
                    )}

                    <div className="mt-4 pt-3 border-t border-[var(--color-border)] flex justify-between items-center">
                      <div className="flex -space-x-2">
                        {[1, 2].map((i) => (
                          <div key={i} className="w-5 h-5 rounded-full bg-slate-700 border border-[var(--color-bg)] text-[8px] flex items-center justify-center">
                            {String.fromCharCode(64 + i)}
                          </div>
                        ))}
                      </div>
                      <Button variant="ghost" size="sm" className="h-6 px-2 text-[10px]">
                        Details
                      </Button>
                    </div>
                  </Card>
                ))}
                
                <button className="w-full py-2 border-2 border-dashed border-[var(--color-border)] rounded-lg text-xs text-[var(--color-text-muted)] hover:border-primary/50 hover:text-primary transition-all">
                  + Add Release
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
