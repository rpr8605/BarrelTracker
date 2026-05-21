import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  History, 
  Search, 
  Filter, 
  Download,
  Eye,
  User,
  Package,
  MapPin,
  FileText
} from 'lucide-react'
import { format } from 'date-fns'

export default async function AuditPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()
  const distilleryId = await getMyDistilleryId(admin, user?.id || '', getActiveDistilleryId())

  // Mock Audit Logs for Demo
  const logs = [
    { id: '1', user: 'William', action: 'Barrel Moved', entity: 'H&H-0104', context: 'Rackhouse A → B', timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString() },
    { id: '2', user: 'Nancy', action: 'Compliance Form Signed', entity: 'TTB-5110.40', context: 'May 2026', timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
    { id: '3', user: 'Amanda', action: 'Tasting Note Added', entity: 'H&H-0104', context: 'Score: 94', timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString() },
    { id: '4', user: 'Gareth', action: 'Proof Updated', entity: 'H&H-0582', context: '114.2° → 112.8°', timestamp: new Date(Date.now() - 1000 * 60 * 300).toISOString() },
    { id: '5', user: 'William', action: 'Report Generated', entity: 'Finance Summary', context: 'Q2 Projections', timestamp: new Date(Date.now() - 1000 * 60 * 400).toISOString() },
    { id: '6', user: 'System', action: 'NFC Tag Linked', entity: 'H&H-0008', context: 'TAG-H&H-0008', timestamp: new Date(Date.now() - 1000 * 60 * 600).toISOString() },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            Activity & Audit Log
          </h1>
          <p className="text-sm text-zinc-500 mt-1">Immutable trail of every action in Hearth & Hollow</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-400">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-[#121212] border-zinc-800 p-4 flex flex-col justify-between h-24">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Total Actions (24h)</p>
          <p className="text-2xl font-bold text-white">42</p>
        </Card>
        <Card className="bg-[#121212] border-zinc-800 p-4 flex flex-col justify-between h-24">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Critical Changes</p>
          <p className="text-2xl font-bold text-red-500">2</p>
        </Card>
        <Card className="bg-[#121212] border-zinc-800 p-4 flex flex-col justify-between h-24">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Most Active User</p>
          <p className="text-2xl font-bold text-primary">William</p>
        </Card>
        <Card className="bg-[#121212] border-zinc-800 p-4 flex flex-col justify-between h-24">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Audit Confidence</p>
          <p className="text-2xl font-bold text-green-500">100%</p>
        </Card>
      </div>

      <Card className="bg-[#121212] border-zinc-800 p-0 overflow-hidden">
        <div className="p-4 border-b border-zinc-800 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search audit trail..." 
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <Button variant="secondary" size="sm" className="bg-zinc-900 border-zinc-800 text-zinc-400">
            <Filter className="w-4 h-4 mr-2" />
            Filter
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                <th className="px-6 py-4">Timestamp</th>
                <th className="px-6 py-4">User</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Entity</th>
                <th className="px-6 py-4">Context</th>
                <th className="px-6 py-4 text-right">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/50 text-sm">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-4 font-mono text-[10px] text-zinc-500">
                    {format(new Date(log.timestamp), 'HH:mm:ss')}
                    <br />
                    {format(new Date(log.timestamp), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold border border-zinc-700">
                        {log.user[0]}
                      </div>
                      <span className="font-medium text-white">{log.user}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-zinc-300">{log.action}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 font-bold text-primary italic">
                      <Package className="w-3 h-3" />
                      {log.entity}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-zinc-500 italic">{log.context}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className="px-2 py-0.5 rounded bg-green-500/10 text-green-500 text-[8px] font-bold uppercase border border-green-500/20">Verified</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
