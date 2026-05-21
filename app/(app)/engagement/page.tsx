'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  Users, 
  Share2, 
  Map, 
  History, 
  TrendingUp, 
  ArrowUpRight,
  Target,
  Zap,
  Star
} from 'lucide-react'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'plays', label: 'Marketing Plays' },
  { id: 'stories', label: 'Bottle Stories' },
  { id: 'trails', label: 'Trails' },
]

const ACTIVE_PLAYS = [
  {
    name: 'Share-a-Barrel',
    active: 142,
    conversion: '12.4%',
    growth: '+5.2%',
    status: 'Active',
    icon: Share2
  },
  {
    name: 'Veterans Trail',
    active: 890,
    conversion: '8.1%',
    growth: '+18%',
    status: 'Trending',
    icon: Map
  },
  {
    name: 'Founder’s Legacy',
    active: 320,
    conversion: '15.6%',
    growth: '+2.1%',
    status: 'Active',
    icon: History
  }
]

export default function EngagementPage() {
  const [activeTab, setActiveTab] = useState('overview')

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Consumer Engagement</h1>
        <p className="text-[var(--color-text-muted)] text-sm">Hearth & Hollow · Digital Presence & Brand Loyalty</p>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/10 border-primary/20">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-primary font-bold uppercase tracking-wider">Total Reach</p>
              <h3 className="text-3xl font-bold mt-1">12.8k</h3>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3" />
                +14% from last month
              </p>
            </div>
            <Users className="w-8 h-8 text-primary opacity-50" />
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Avg. Story Scans</p>
              <h3 className="text-3xl font-bold mt-1">4.2</h3>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">
                Per bottle / lifetime
              </p>
            </div>
            <Zap className="w-8 h-8 text-yellow-500 opacity-50" />
          </div>
        </Card>
        <Card>
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">Loyalty Index</p>
              <h3 className="text-3xl font-bold mt-1">88/100</h3>
              <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                Top 5% of distilleries
              </p>
            </div>
            <Star className="w-8 h-8 text-orange-500 opacity-50" />
          </div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)]">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id ? 'text-primary' : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
            )}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold">Active Marketing Plays</h2>
          <div className="grid grid-cols-1 gap-4">
            {ACTIVE_PLAYS.map((play) => (
              <Card key={play.name} className="group hover:border-primary/50 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-[var(--color-bg-secondary)] rounded-xl group-hover:bg-primary/10 transition-colors">
                    <play.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-bold">{play.name}</h4>
                        <p className="text-xs text-[var(--color-text-muted)]">{play.active} active participants</p>
                      </div>
                      <Badge variant={play.status === 'Trending' ? 'success' : 'primary'}>{play.status}</Badge>
                    </div>
                    <div className="flex gap-6 mt-3">
                      <div>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold">Conversion</p>
                        <p className="text-sm font-semibold">{play.conversion}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-[var(--color-text-muted)] uppercase font-bold">Growth</p>
                        <p className="text-sm font-semibold text-green-400">{play.growth}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Benchmarks</h2>
          <Card className="space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--color-text-muted)]">NFC Engagement</span>
                <span className="font-bold">84%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '84%' }} />
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Industry avg: 12%</p>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--color-text-muted)]">Story Completion</span>
                <span className="font-bold">62%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '62%' }} />
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Industry avg: 24%</p>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-[var(--color-text-muted)]">Repeat Purchase</span>
                <span className="font-bold">45%</span>
              </div>
              <div className="w-full h-1.5 bg-[var(--color-bg-secondary)] rounded-full overflow-hidden">
                <div className="h-full bg-primary" style={{ width: '45%' }} />
              </div>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-1">Industry avg: 18%</p>
            </div>

            <Button variant="secondary" size="sm" className="w-full mt-4">
              Detailed Analytics
            </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
