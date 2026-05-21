import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { 
  Building2, 
  Users, 
  Shield, 
  Bell, 
  CreditCard, 
  Wrench,
  ChevronRight,
  UserPlus
} from 'lucide-react'
import Link from 'next/link'

export default async function SetupPage({ searchParams }: { searchParams: { tab?: string } }) {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()
  const distilleryId = await getMyDistilleryId(admin, user?.id || '', getActiveDistilleryId())

  const activeTab = searchParams.tab || 'profile'

  // Fetch Distillery Info
  const { data: distillery } = await admin
    .from('distilleries')
    .select('*')
    .eq('id', distilleryId)
    .single()

  const tabs = [
    { id: 'profile', label: 'Distillery Profile', icon: Building2 },
    { id: 'users', label: 'Users & Roles', icon: Users },
    { id: 'stations', label: 'Workstations', icon: Wrench },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing & Plan', icon: CreditCard },
    { id: 'security', label: 'Security & Audit', icon: Shield },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Admin & Setup</h1>
        <p className="text-sm text-zinc-500 mt-1">Configure Hearth & Hollow platform settings</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <aside className="space-y-1">
          {tabs.map((tab) => (
            <Link 
              key={tab.id} 
              href={`/setup?tab=${tab.id}`}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                activeTab === tab.id 
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5' 
                  : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900 border border-transparent'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {activeTab === tab.id && <ChevronRight className="w-4 h-4 ml-auto" />}
            </Link>
          ))}
        </aside>

        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <Card className="bg-[#121212] border-zinc-800 p-8">
              <h2 className="text-lg font-bold text-white mb-6">Distillery Profile</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Distillery Name</label>
                  <input type="text" defaultValue={distillery?.name} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">DSP Number</label>
                  <input type="text" defaultValue={distillery?.dsp_number} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Location</label>
                  <input type="text" defaultValue={distillery?.location} className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Primary Contact Email</label>
                  <input type="email" placeholder="admin@hearth-hollow.com" className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary" />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Timezone</label>
                  <select className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary">
                    <option>Central Time (US & Canada)</option>
                    <option>Eastern Time (US & Canada)</option>
                    <option>Mountain Time (US & Canada)</option>
                    <option>Pacific Time (US & Canada)</option>
                  </select>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-end">
                <Button>Save Changes</Button>
              </div>
            </Card>
          )}

          {activeTab === 'users' && (
            <Card className="bg-[#121212] border-zinc-800 p-0 overflow-hidden">
              <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Users & Roles</h2>
                <Button size="sm" variant="secondary" className="bg-zinc-800 border-zinc-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invite User
                </Button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-zinc-900/50 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                      <th className="px-6 py-4">User</th>
                      <th className="px-6 py-4">Role</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50 text-sm">
                    {[
                      { name: 'William', email: 'william@hearth-hollow.com', role: 'Owner/Admin', status: 'Active' },
                      { name: 'Danielle', email: 'danielle@hearth-hollow.com', role: 'CEO', status: 'Active' },
                      { name: 'Nancy', email: 'nancy@hearth-hollow.com', role: 'Compliance', status: 'Active' },
                      { name: 'Amanda', email: 'amanda@hearth-hollow.com', role: 'Blender', status: 'Active' },
                      { name: 'Gareth', email: 'gareth@hearth-hollow.com', role: 'Production', status: 'Active' },
                      { name: 'Ryan', email: 'ryan@hearth-hollow.com', role: 'Admin', status: 'Active' },
                    ].map((u) => (
                      <tr key={u.email} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-bold border border-zinc-700">
                              {u.name[0]}
                            </div>
                            <div>
                              <p className="font-medium text-white">{u.name}</p>
                              <p className="text-xs text-zinc-500">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 text-[10px] font-bold uppercase">{u.role}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1.5 text-xs text-green-500 font-medium">
                            <div className="w-1 h-1 bg-green-500 rounded-full" />
                            {u.status}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-zinc-500 hover:text-white transition-colors">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {(activeTab !== 'profile' && activeTab !== 'users') && (
            <div className="py-24 text-center border-2 border-dashed border-zinc-800 rounded-2xl">
              <p className="text-zinc-500 italic">Configuration module for {activeTab} coming soon in v2.5</p>
              <Button variant="secondary" className="mt-4 bg-zinc-900 border-zinc-800" size="sm">Back to Dashboard</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
