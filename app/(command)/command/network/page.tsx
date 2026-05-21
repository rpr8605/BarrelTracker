import { getNetwork } from '@/lib/command-center/data'
import { CommandCard, CommandTable, CommandBadge } from '@/components/command-center/UI'
import { Share2, Users, Lightbulb, Handshake } from 'lucide-react'

export default async function NetworkPage() {
  const network = await getNetwork()

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold tracking-tight">Network Capital</h2>
        <button className="px-3 py-1.5 bg-[#BA7517] text-white rounded text-xs font-medium hover:bg-[#BA7517]/90 transition-colors">
          + Log Conversation
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Strategic Partners', value: 8, icon: Handshake },
          { label: 'Investors in Loop', value: 14, icon: Users },
          { label: 'Warm Intros (MTD)', value: 6, icon: Share2 },
          { label: 'Growth Experiments', value: 3, icon: Lightbulb },
        ].map((stat) => (
          <CommandCard key={stat.label} className="flex items-center gap-4 py-6">
            <div className="w-10 h-10 rounded-full bg-[#141414] border border-[#222222] flex items-center justify-center text-[#BA7517]">
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-[#666666] font-bold">{stat.label}</p>
              <h3 className="text-2xl font-bold mt-0.5">{stat.value}</h3>
            </div>
          </CommandCard>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <CommandCard title="Active Intros & Outreach">
          <CommandTable headers={['Opportunity', 'Connector', 'Target', 'Status']}>
            {network.map((item) => (
              <tr key={item.id} className="hover:bg-[#141414]/30 transition-colors">
                <td className="px-4 py-4">
                  <p className="text-sm font-bold text-white">{item.name}</p>
                  {item.notes && <p className="text-[10px] text-[#666666] mt-1 italic">{item.notes}</p>}
                </td>
                <td className="px-4 py-4 text-xs text-[#a0a0a0]">
                  {item.source}
                </td>
                <td className="px-4 py-4 text-xs text-white font-medium">
                  {item.target}
                </td>
                <td className="px-4 py-4">
                  <CommandBadge variant={item.status === 'connected' ? 'success' : 'warning'}>
                    {item.status}
                  </CommandBadge>
                </td>
              </tr>
            ))}
          </CommandTable>
        </CommandCard>

        <CommandCard title="Strategic Priorities">
          <div className="space-y-4">
            <div className="p-4 bg-[#141414] rounded-xl border border-[#222222] group hover:border-[#BA7517]/50 transition-all cursor-pointer">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#BA7517]" />
                Series A Fundraising
              </h4>
              <p className="text-xs text-[#a0a0a0] mt-2 leading-relaxed">
                Objective: Secure $4M @ $20M Post. Currently in data room preparation. Focus on spirits-tech specialized funds.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#222222] border border-[#050505] flex items-center justify-center text-[8px] font-bold">R</div>
                </div>
                <div className="flex-1 h-1.5 bg-[#050505] rounded-full overflow-hidden border border-[#222222]">
                  <div className="h-full bg-[#BA7517] w-[65%]" />
                </div>
                <span className="text-[10px] font-mono text-[#666666]">65%</span>
              </div>
            </div>

            <div className="p-4 bg-[#141414] rounded-xl border border-[#222222] group hover:border-[#BA7517]/50 transition-all cursor-pointer">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Distribution Partnership
              </h4>
              <p className="text-xs text-[#a0a0a0] mt-2 leading-relaxed">
                Objective: Partner with major glass/closure manufacturers to pre-install NFC tags.
              </p>
              <div className="flex items-center gap-4 mt-4">
                <div className="flex -space-x-2">
                  <div className="w-6 h-6 rounded-full bg-[#222222] border border-[#050505] flex items-center justify-center text-[8px] font-bold">G</div>
                </div>
                <div className="flex-1 h-1.5 bg-[#050505] rounded-full overflow-hidden border border-[#222222]">
                  <div className="h-full bg-blue-500 w-[30%]" />
                </div>
                <span className="text-[10px] font-mono text-[#666666]">30%</span>
              </div>
            </div>
          </div>
        </CommandCard>
      </div>
    </div>
  )
}
