import { createServerSupabaseClient, createServiceClient, getActiveDistilleryId } from '@/lib/supabase-server'
import { getMyDistilleryId } from '@/lib/distillery'
import { DashboardCard } from '@/components/dashboard/DashboardCard'
import { ActionItem } from '@/components/dashboard/ActionItem'
import { AssistantTrigger } from '@/components/ai/AssistantTrigger'
import { Card, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { ShieldCheck, Clock, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function DashboardPage() {
  const supabase = createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  const admin = createServiceClient()

  const distilleryId = await getMyDistilleryId(admin, user?.id || '', getActiveDistilleryId())

  // Fetch Distillery Name
  const { data: distillery } = await admin
    .from('distilleries')
    .select('name')
    .eq('id', distilleryId)
    .single()

  // Fetch Action Center Items
  const { data: actionItems } = await admin
    .from('action_center_items')
    .select('*')
    .eq('distillery_id', distilleryId)
    .eq('status', 'detected')
    .order('severity', { ascending: false })
    .limit(3)

  // Fetch Report Snapshots
  const { data: snapshots } = await admin
    .from('report_snapshots')
    .select('*')
    .eq('distillery_id', distilleryId)
    .order('generated_at', { ascending: false })

  // Fetch Barrel Stats
  const { count: totalBarrels } = await admin
    .from('barrels')
    .select('*', { count: 'exact', head: true })
    .eq('distillery_id', distilleryId)

  const now = new Date()

  // Helper to get metric from snapshot
  const getMetric = (type: string, key: string, fallback: any) => {
    const s = snapshots?.find(s => s.report_type === type)
    return s?.metrics_json?.[key] || fallback
  }

  return (
    <div className="space-y-8 pb-12 px-4 md:px-0">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Today in {distillery?.name || 'Hearth & Hollow'}</h1>
          <p className="text-sm text-zinc-500 flex items-center gap-2 mt-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-primary" />
            {format(now, 'EEEE, MMMM do, h:mm a')}
          </p>
        </div>
        
        <AssistantTrigger />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Productivity Snapshot */}
        <DashboardCard 
          title="Productivity Snapshot"
          metrics={[
            { label: 'Yield Efficiency', value: getMetric('operations', 'yield_efficiency', '94.2%'), subValue: '+2.1%' },
            { label: 'Aging Velocity', value: getMetric('operations', 'aging_velocity', '0.82'), subValue: 'mo/mo' },
            { label: 'Production Score', value: getMetric('operations', 'production_score', '98'), subValue: '/100' },
            { label: 'Capacity Use', value: getMetric('operations', 'capacity_use', '88%'), subValue: '842/960' }
          ]}
          highlight={{ label: 'Production up 12% vs last month', status: 'green' }}
          actionLabel="View Operations"
          href="/operations"
        />

        {/* 2. Action Center */}
        <Card className="flex flex-col h-full bg-[#121212] border-[#222] md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-[#222] mb-4">
            <h3 className="text-sm font-bold tracking-widest text-white uppercase">Action Center</h3>
            <div className="px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary">
              {actionItems?.length || 0} PENDING
            </div>
          </CardHeader>
          
          <div className="flex-1 space-y-3">
            {actionItems && actionItems.length > 0 ? (
              actionItems.map((item) => (
                <ActionItem 
                  key={item.id}
                  id={item.id}
                  title={item.title}
                  description={item.description}
                  severity={item.severity as any}
                  module={item.module}
                  dueAt={item.due_at}
                  href={`/action-center?id=${item.id}`}
                />
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-8 opacity-50">
                <ShieldCheck className="w-8 h-8 mb-2 text-zinc-700" />
                <p className="text-sm font-medium text-zinc-500">All clear. No urgent actions detected.</p>
              </div>
            )}
          </div>

          <div className="mt-6">
            <Link href="/action-center" className="block">
              <Button 
                variant="secondary" 
                className="w-full justify-between group bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-300 hover:text-white"
              >
                <span>Full Action Center</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </Card>

        {/* 3. Barrel Repository */}
        <DashboardCard 
          title="Barrel Repository"
          metrics={[
            { label: 'Total Inventory', value: totalBarrels || 1242, subValue: 'Barrels' },
            { label: 'Ready for Bottling', value: getMetric('inventory', 'ready_count', '12'), subValue: 'Next 30d' },
            { label: 'Warehouse Health', value: '99.8%', subValue: 'Temp/Hum' },
            { label: 'Value at Maturity', value: getMetric('finance', 'maturity_valuation', '$4.2M'), subValue: 'Est.' }
          ]}
          highlight={{ label: '3 barrels require regauging', status: 'yellow' }}
          actionLabel="Inventory View"
          href="/barrels"
        />

        {/* 4. Operations */}
        <DashboardCard 
          title="Operations"
          metrics={[
            { label: 'Active Batches', value: getMetric('operations', 'active_batches', '8'), subValue: 'In Process' },
            { label: 'Throughput', value: getMetric('operations', 'throughput', '420'), subValue: 'PG/Day' },
            { label: 'Energy Usage', value: '-4%', subValue: 'vs Baseline' },
            { label: 'Labor Hours', value: '164', subValue: 'This Week' }
          ]}
          highlight={{ label: 'Still #2 maintenance due in 4 days', status: 'yellow' }}
          actionLabel="Operational Logs"
          href="/operations"
        />

        {/* 5. Release Pipeline */}
        <DashboardCard 
          title="Release Pipeline"
          metrics={[
            { label: 'Upcoming Drops', value: '2', subValue: 'Waitlisted' },
            { label: 'Allocated Bottles', value: '1,200', subValue: 'Pre-sold' },
            { label: 'Pipeline Value', value: '$184K', subValue: 'Confirmed' },
            { label: 'Market Demand', value: 'High', subValue: '3.2x' }
          ]}
          highlight={{ label: 'Single Malt Drop opens in 48h', status: 'green' }}
          actionLabel="Marketplace"
          href="/release-pipeline"
        />

        {/* 6. Finance */}
        <DashboardCard 
          title="Finance"
          metrics={[
            { label: 'Current Valuation', value: getMetric('finance', 'current_valuation', '$2.8M'), subValue: 'Asset Value' },
            { label: 'Excise Liability', value: getMetric('finance', 'excise_liability', '$12,402'), subValue: 'Pending' },
            { label: 'Cash Conversion', value: '14.2', subValue: 'Months' },
            { label: 'Net Margin', value: '38%', subValue: 'Forecast' }
          ]}
          highlight={{ label: 'Q3 Tax filing due in 12 days', status: 'yellow' }}
          actionLabel="Financial Health"
          href="/finance"
        />

        {/* 7. Compliance */}
        <DashboardCard 
          title="Compliance"
          metrics={[
            { label: 'Record Accuracy', value: '100%', subValue: 'Verified' },
            { label: 'TTB Status', value: 'Filed', subValue: 'Period Ending May' },
            { label: 'Unchecked Gauges', value: '0', subValue: 'Audit Ready' },
            { label: 'Permit Status', value: 'Active', subValue: 'Exp 2028' }
          ]}
          highlight={{ label: 'All federal records compliant', status: 'green' }}
          actionLabel="Compliance Center"
          href="/compliance"
        />

        {/* 8. Front of House */}
        <DashboardCard 
          title="Front of House"
          metrics={[
            { label: 'Fan Engagement', value: '8.4K', subValue: 'Followers' },
            { label: 'Story Completion', value: '64%', subValue: 'Last Batch' },
            { label: 'Club Members', value: '412', subValue: '+18' },
            { label: 'Review Average', value: '4.8', subValue: 'Stars' }
          ]}
          highlight={{ label: 'New barrel story trending', status: 'green' }}
          actionLabel="Engagement Stats"
          href="/engagement"
        />
      </div>
    </div>
  )
}
