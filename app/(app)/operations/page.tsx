'use client'

import { Card, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Activity, 
  FlaskConical, 
  Thermometer, 
  Droplets, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  Database
} from 'lucide-react'

const METRICS = [
  { label: 'Active Batches', value: '12', change: '+2', icon: Activity },
  { label: 'Avg Throughput', value: '450 gal/day', change: '+12%', icon: Droplets },
  { label: 'Energy Usage', value: '1.2 MW', change: '-5%', icon: Thermometer },
  { label: 'System Uptime', value: '99.9%', change: 'Stable', icon: CheckCircle2 },
]

const STATIONS = [
  {
    name: 'Fermentation',
    status: 'healthy',
    details: '6 tanks active',
    temp: '72°F',
    efficiency: '94%',
    issues: 0,
  },
  {
    name: 'Distillation',
    status: 'warning',
    details: 'Pot Still #2 offline',
    temp: '185°F',
    efficiency: '78%',
    issues: 1,
  },
  {
    name: 'Filtering',
    status: 'healthy',
    details: 'All systems go',
    efficiency: '99%',
    issues: 0,
  },
  {
    name: 'Aging Prep',
    status: 'error',
    details: 'NFC scanner failure',
    efficiency: '0%',
    issues: 3,
  },
]

const CLEANUP_QUEUE = [
  { id: '1', task: 'Missing grain weight', batch: 'BT-2024-001', severity: 'medium' },
  { id: '2', task: 'Duplicate sensor data', batch: 'BT-2024-003', severity: 'low' },
  { id: '3', task: 'Invalid temperature spike', batch: 'BT-2023-442', severity: 'high' },
]

export default function OperationsPage() {
  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Operations Command</h1>
        <p className="text-[var(--color-text-muted)] text-sm">Hearth & Hollow Facility · Live Monitoring</p>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <Card key={m.label} className="flex items-center gap-4">
            <div className="p-3 bg-[var(--color-bg-secondary)] rounded-lg">
              <m.icon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-xs text-[var(--color-text-muted)] uppercase font-semibold">{m.label}</p>
              <p className="text-xl font-bold">{m.value}</p>
              <p className={`text-xs ${m.change.startsWith('+') ? 'text-green-500' : m.change === 'Stable' ? 'text-blue-500' : 'text-red-500'}`}>
                {m.change}
              </p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Station Health */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Station Health
            </h2>
            <Button variant="ghost" size="sm">View All Stations</Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {STATIONS.map((s) => (
              <Card key={s.name} className="relative overflow-hidden">
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${
                  s.status === 'healthy' ? 'bg-green-500' : 
                  s.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-bold">{s.name}</h3>
                  <Badge variant={s.status === 'healthy' ? 'success' : s.status === 'warning' ? 'warning' : 'danger'}>
                    {s.status.toUpperCase()}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-[var(--color-text-secondary)]">{s.details}</p>
                  <div className="flex justify-between text-xs border-t border-[var(--color-border)] pt-2 mt-2">
                    {s.temp && <span>Temp: {s.temp}</span>}
                    <span>Efficiency: {s.efficiency}</span>
                    <span className={s.issues > 0 ? 'text-red-400' : 'text-green-400'}>
                      {s.issues} Issues
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Data Cleanup Queue */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Database className="w-5 h-5" />
              Cleanup Queue
            </h2>
            <Badge className="bg-primary/20 text-primary">{CLEANUP_QUEUE.length} Tasks</Badge>
          </div>
          <Card className="divide-y divide-[var(--color-border)] p-0">
            {CLEANUP_QUEUE.map((task) => (
              <div key={task.id} className="p-4 hover:bg-[var(--color-bg-secondary)] transition-colors cursor-pointer group">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-medium">{task.task}</p>
                    <p className="text-xs text-[var(--color-text-muted)] flex items-center gap-1 mt-1">
                      <Clock className="w-3 h-3" />
                      {task.batch}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[var(--color-text-muted)] group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            ))}
            <div className="p-4 text-center">
              <Button variant="secondary" size="sm" className="w-full">
                Process All Tasks
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
