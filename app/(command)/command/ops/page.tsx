import { getPilots } from '@/lib/command-center/data'
import { CommandCard, CommandTable, CommandBadge } from '@/components/command-center/UI'
import { AlertTriangle, CheckCircle2, PlayCircle } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default async function OpsPage() {
  const pilots = await getPilots()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Operations & Active Pilots</h2>
        <button className="px-3 py-1.5 bg-[#BA7517] text-white rounded text-xs font-medium hover:bg-[#BA7517]/90 transition-colors">
          + Start Pilot
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CommandCard className="lg:col-span-2 p-0" title="Active Pilot Portfolio">
          <CommandTable headers={['Account', 'Stage', 'Health', 'Revenue Impact', 'Blockers']}>
            {pilots.map((pilot) => (
              <tr key={pilot.id} className="hover:bg-[#141414]/30 transition-colors">
                <td className="px-4 py-4 text-sm font-bold text-white">
                  {pilot.name}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    {pilot.stage === 'active' ? (
                      <PlayCircle size={14} className="text-[#BA7517]" />
                    ) : (
                      <Clock size={14} className="#666666" />
                    )}
                    <span className="text-xs uppercase tracking-wider text-[#a0a0a0] font-medium">{pilot.stage}</span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <CommandBadge variant={pilot.health === 'healthy' ? 'success' : pilot.health === 'at-risk' ? 'danger' : 'warning'}>
                    {pilot.health}
                  </CommandBadge>
                </td>
                <td className="px-4 py-4 text-sm font-mono">
                  {formatCurrency(pilot.revenueImpact)}/mo
                </td>
                <td className="px-4 py-4">
                  {pilot.blockers && pilot.blockers.length > 0 ? (
                    <div className="flex flex-col gap-1">
                      {pilot.blockers.map((b, i) => (
                        <div key={i} className="flex items-center gap-1 text-[10px] text-red-400">
                          <AlertTriangle size={10} />
                          <span>{b}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-[10px] text-green-500 font-bold uppercase tracking-widest">Clear</span>
                  )}
                </td>
              </tr>
            ))}
          </CommandTable>
        </CommandCard>

        <div className="space-y-6">
          <CommandCard title="Product Feedback Loop">
            <div className="space-y-4">
              <div className="p-3 bg-[#141414] rounded-lg border border-[#222222]">
                <div className="flex items-center justify-between mb-2">
                  <CommandBadge variant="primary">High Impact</CommandBadge>
                  <span className="text-[10px] text-[#666666] font-mono">$45k ARR Tied</span>
                </div>
                <p className="text-xs text-white font-medium">Bulk NFC Tag Commissioning</p>
                <p className="text-[10px] text-[#666666] mt-1">Requested by Highland & Blue Ridge</p>
              </div>
              <div className="p-3 bg-[#141414] rounded-lg border border-[#222222]">
                <div className="flex items-center justify-between mb-2">
                  <CommandBadge>UI/UX</CommandBadge>
                  <span className="text-[10px] text-[#666666] font-mono">$12k ARR Tied</span>
                </div>
                <p className="text-xs text-white font-medium">Dark Mode for Mobile App</p>
                <p className="text-[10px] text-[#666666] mt-1">Requested by Copper Still</p>
              </div>
              <button className="w-full py-2 border border-[#222222] rounded-lg text-[10px] uppercase tracking-widest text-[#666666] hover:text-white transition-all">
                View Feedback Queue
              </button>
            </div>
          </CommandCard>

          <CommandCard title="Implementation Blockers">
            <div className="flex items-center gap-3 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <AlertTriangle className="text-red-500 shrink-0" size={18} />
              <div>
                <p className="text-xs text-red-200 font-medium">Hardware Stock Low</p>
                <p className="text-[10px] text-red-400/70">Only 150 tags remaining in Nashville hub.</p>
              </div>
            </div>
          </CommandCard>
        </div>
      </div>
    </div>
  )
}

function Clock({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
