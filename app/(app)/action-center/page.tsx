import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
import { ActionItem } from '@/components/dashboard/ActionItem'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  ShieldCheck, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Filter, 
  Search,
  ArrowRight
} from 'lucide-react'
import Link from 'next/link'

export default async function ActionCenterPage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()
  const distilleryId = await getMyDistilleryId(admin, user?.id || '', getActiveDistilleryId())

  const activeTab = searchParams.tab || 'mine'

  // Fetch Action Center Items
  const { data: allItems } = await admin
    .from('action_center_items')
    .select('*')
    .eq('distillery_id', distilleryId)
    .order('created_at', { ascending: false })

  const items = allItems || []
  
  const counts = {
    mine: items.filter(i => i.status !== 'resolved' && (i.assigned_to === user?.id || !i.assigned_to)).length,
    critical: items.filter(i => i.severity === 'critical' && i.status !== 'resolved').length,
    approvals: items.filter(i => i.module === 'approvals' && i.status !== 'resolved').length,
    compliance: items.filter(i => i.module === 'compliance' && i.status !== 'resolved').length,
    operations: items.filter(i => i.module === 'operations' && i.status !== 'resolved').length,
    resolved: items.filter(i => i.status === 'resolved').length,
  }

  const filteredItems = items.filter(i => {
    if (activeTab === 'mine') return i.status !== 'resolved' && (i.assigned_to === user?.id || !i.assigned_to)
    if (activeTab === 'critical') return i.severity === 'critical' && i.status !== 'resolved'
    if (activeTab === 'resolved') return i.status === 'resolved'
    return i.module === activeTab && i.status !== 'resolved'
  })

  const tabs = [
    { id: 'mine', label: 'Mine', count: counts.mine },
    { id: 'critical', label: 'Critical', count: counts.critical },
    { id: 'approvals', label: 'Approvals', count: counts.approvals },
    { id: 'compliance', label: 'Compliance', count: counts.compliance },
    { id: 'operations', label: 'Operations', count: counts.operations },
    { id: 'resolved', label: 'Resolved', count: counts.resolved },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Action Center</h1>
          <p className="text-sm text-zinc-500 mt-1">Centralized decision inbox for Hearth & Hollow</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search actions..." 
              className="pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary w-64"
            />
          </div>
          <Button variant="secondary" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-400">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-zinc-800 pb-px overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <Link 
            key={tab.id} 
            href={`/action-center?tab=${tab.id}`}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 relative ${
              activeTab === tab.id 
                ? 'text-primary border-primary' 
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full ${
                activeTab === tab.id ? 'bg-primary/20 text-primary' : 'bg-zinc-800 text-zinc-500'
              }`}>
                {tab.count}
              </span>
            )}
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => (
              <Card key={item.id} className="bg-[#121212] border-zinc-800 p-5 hover:border-zinc-700 transition-all group">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-lg ${
                    item.severity === 'critical' ? 'bg-red-500/10 text-red-500' :
                    item.severity === 'high' ? 'bg-orange-500/10 text-orange-500' :
                    item.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-500' :
                    'bg-zinc-500/10 text-zinc-500'
                  }`}>
                    {item.severity === 'critical' ? <AlertCircle className="w-5 h-5" /> :
                     item.status === 'resolved' ? <CheckCircle2 className="w-5 h-5" /> :
                     <Clock className="w-5 h-5" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">{item.module}</span>
                      <span className="text-[10px] font-mono text-zinc-600">{format(new Date(item.created_at), 'MMM d, h:mm a')}</span>
                    </div>
                    <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">{item.title}</h3>
                    <p className="text-sm text-zinc-400 mt-1 leading-relaxed">{item.description}</p>
                    
                    <div className="mt-4 flex items-center gap-3">
                      <Button variant="secondary" size="sm" className="bg-zinc-800 border-zinc-700 text-xs py-1 h-8">
                        View Object
                      </Button>
                      <Button size="sm" className="text-xs py-1 h-8">
                        Fix Now
                      </Button>
                      <button className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors ml-auto font-medium">Snooze</button>
                      <div className="w-px h-3 bg-zinc-800" />
                      <button className="text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium">Dismiss</button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="py-24 text-center">
              <div className="w-16 h-16 bg-zinc-900 rounded-full flex items-center justify-center mx-auto mb-4 border border-zinc-800">
                <ShieldCheck className="w-8 h-8 text-zinc-700" />
              </div>
              <h3 className="text-lg font-medium text-white">No actions found</h3>
              <p className="text-sm text-zinc-500 max-w-xs mx-auto mt-1">This section is all clear. Check back later for new alerts or tasks.</p>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Card className="bg-[#121212] border-zinc-800 p-6">
            <h3 className="text-sm font-bold tracking-widest text-zinc-500 uppercase mb-4">Recommended Actions</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5 font-bold text-xs">1</div>
                <div>
                  <p className="text-sm font-medium text-white">Run TTB Health Check</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Validate all storage records before month-end.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary shrink-0 mt-0.5 font-bold text-xs">2</div>
                <div>
                  <p className="text-sm font-medium text-white">Review B-104 Tasting</p>
                  <p className="text-xs text-zinc-500 mt-0.5">Amanda flagged this for final bottling review.</p>
                </div>
              </div>
            </div>
            <Button className="w-full mt-6 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-zinc-300 hover:text-white" variant="secondary">
              View Strategy
            </Button>
          </Card>

          <Card className="bg-[#121212] border-zinc-800 p-6">
            <h3 className="text-sm font-bold tracking-widest text-zinc-500 uppercase mb-4">Operator Presence</h3>
            <div className="space-y-4">
              {[
                { name: 'William', role: 'Admin', status: 'online' },
                { name: 'Danielle', role: 'CEO', status: 'online' },
                { name: 'Nancy', role: 'Operations', status: 'offline' },
                { name: 'Gareth', role: 'Production', status: 'online' },
              ].map((op) => (
                <div key={op.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold border border-zinc-700">
                      {op.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{op.name}</p>
                      <p className="text-xs text-zinc-500">{op.role}</p>
                    </div>
                  </div>
                  <div className={`w-2 h-2 rounded-full ${op.status === 'online' ? 'bg-green-500' : 'bg-zinc-700'}`} />
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function format(date: Date, formatStr: string) {
  // Simple format helper for demo
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  if (formatStr === 'MMM d, h:mm a') {
    const h = date.getHours()
    const m = date.getMinutes()
    return `${months[date.getMonth()]} ${date.getDate()}, ${h % 12 || 12}:${m < 10 ? '0' + m : m} ${h >= 12 ? 'PM' : 'AM'}`
  }
  return date.toISOString()
}
