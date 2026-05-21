import { getMetrics, getTasks } from '@/lib/command-center/data'
import { CommandMetric, CommandCard, CommandBadge } from '@/components/command-center/UI'
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react'

export default async function CommandOverview() {
  const metrics = await getMetrics()
  const tasks = await getTasks()

  const operators = ['Ryan', 'Nancy', 'Gareth'] as const

  return (
    <div className="p-6 space-y-8">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m) => (
          <CommandMetric 
            key={m.label}
            label={m.label}
            value={m.value}
            change={m.change}
            trend={m.trend}
          />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Next Actions by Operator */}
        {operators.map((operator) => {
          const operatorTasks = tasks.filter(t => t.assignee === operator)
          return (
            <CommandCard key={operator} title={`${operator}'s Focus`}>
              <div className="space-y-4">
                {operatorTasks.length > 0 ? (
                  operatorTasks.map((task) => (
                    <div key={task.id} className="group flex items-start gap-3 p-2 rounded-lg hover:bg-[#141414] transition-colors border border-transparent hover:border-[#222222]">
                      <div className="mt-1">
                        {task.priority === 'urgent' ? (
                          <AlertCircle size={16} className="text-red-500" />
                        ) : task.status === 'done' ? (
                          <CheckCircle2 size={16} className="text-green-500" />
                        ) : (
                          <Clock size={16} className="text-[#666666]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <CommandBadge variant={task.priority === 'urgent' ? 'danger' : task.priority === 'high' ? 'warning' : 'default'}>
                            {task.priority}
                          </CommandBadge>
                          <span className="text-[10px] text-[#666666] font-mono">{task.dueDate}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#666666] italic py-4 text-center">No active focus areas</p>
                )}
                <button className="w-full py-2 border border-dashed border-[#222222] rounded-lg text-[10px] uppercase tracking-widest text-[#666666] hover:text-white hover:border-[#BA7517] transition-all mt-2">
                  + Add Action
                </button>
              </div>
            </CommandCard>
          )
        })}
      </div>

      {/* System Health / Recent Activity */}
      <CommandCard title="Business Velocity">
        <div className="h-64 flex items-center justify-center border border-dashed border-[#222222] rounded-lg bg-[#050505]">
          <div className="text-center">
            <p className="text-[#666666] text-sm">Velocity Chart Placeholder</p>
            <p className="text-[10px] text-[#444444] mt-1">(Requires Recharts Implementation)</p>
          </div>
        </div>
      </CommandCard>
    </div>
  )
}
