import { getPipeline } from '@/lib/command-center/data'
import { CommandCard, CommandTable, CommandBadge } from '@/components/command-center/UI'
import { formatCurrency } from '@/lib/utils'

export default async function PipelinePage() {
  const pipeline = await getPipeline()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">CRM & Pipeline</h2>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 bg-[#141414] border border-[#222222] rounded text-xs font-medium hover:bg-[#1a1a1a] transition-colors">
            Filter
          </button>
          <button className="px-3 py-1.5 bg-[#BA7517] text-white rounded text-xs font-medium hover:bg-[#BA7517]/90 transition-colors">
            + New Opportunity
          </button>
        </div>
      </div>

      <CommandCard className="p-0">
        <CommandTable headers={['Account', 'Opportunity', 'Stage', 'Value', 'Priority', 'Owner', 'Next Action']}>
          {pipeline.map((opp) => (
            <tr key={opp.id} className="hover:bg-[#141414]/30 transition-colors group">
              <td className="px-4 py-4">
                <p className="text-sm font-bold text-white">{opp.accountName}</p>
                <p className="text-[10px] text-[#666666] uppercase tracking-tighter">Account ID: {opp.accountId}</p>
              </td>
              <td className="px-4 py-4 text-sm text-[#a0a0a0] group-hover:text-white transition-colors">
                {opp.name}
              </td>
              <td className="px-4 py-4">
                <CommandBadge variant={opp.stage === 'closed-won' ? 'success' : opp.stage === 'closed-lost' ? 'danger' : 'default'}>
                  {opp.stage.replace('-', ' ')}
                </CommandBadge>
              </td>
              <td className="px-4 py-4 text-sm font-mono font-bold">
                {formatCurrency(opp.value)}
              </td>
              <td className="px-4 py-4">
                <CommandBadge variant={opp.priority === 'high' || opp.priority === 'urgent' ? 'warning' : 'default'}>
                  {opp.priority}
                </CommandBadge>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#222222] flex items-center justify-center text-[8px] font-bold">
                    {opp.owner[0]}
                  </div>
                  <span className="text-xs text-[#a0a0a0]">{opp.owner}</span>
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="text-xs text-[#a0a0a0] italic">{opp.nextAction || '—'}</p>
                {opp.expectedCloseDate && (
                  <p className="text-[10px] text-[#666666] mt-1 font-mono">ETA: {opp.expectedCloseDate}</p>
                )}
              </td>
            </tr>
          ))}
        </CommandTable>
      </CommandCard>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <CommandCard title="Stalled Opportunities">
          <div className="py-8 text-center border border-dashed border-[#222222] rounded-lg">
            <p className="text-xs text-[#666666]">No stalled opportunities detected.</p>
          </div>
        </CommandCard>
        <CommandCard title="Recent Account Activity">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 text-xs">
                <div className="w-1 h-1 rounded-full bg-[#BA7517] mt-1.5 shrink-0" />
                <p className="text-[#a0a0a0]">
                  <span className="text-white font-medium">Nancy</span> contacted <span className="text-white font-medium">Copper Still Co</span> regarding implementation.
                </p>
                <span className="ml-auto text-[#444444] font-mono">2h ago</span>
              </div>
            ))}
          </div>
        </CommandCard>
      </div>
    </div>
  )
}
