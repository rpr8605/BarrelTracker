'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  DollarSign, 
  BarChart3, 
  Package, 
  ArrowUpRight, 
  ArrowDownRight,
  Search,
  Download,
  Filter,
  PieChart
} from 'lucide-react'

const TABS = [
  { id: 'summary', label: 'Summary' },
  { id: 'inventory', label: 'Sellable Inventory' },
  { id: 'upcoming', label: 'Upcoming Value' },
  { id: 'assets', label: 'Barrel Assets' },
]

const METRICS = [
  { label: 'Current Valuation', value: '$2.45M', change: '+8.2%', trend: 'up', icon: DollarSign },
  { label: 'Excise Liability', value: '$84,200', change: '+2.1%', trend: 'down', icon: PieChart },
  { label: 'Case Inventory', value: '4,120', change: '-45', trend: 'down', icon: Package },
  { label: 'Projected Q3', value: '$1.1M', change: '+15%', trend: 'up', icon: BarChart3 },
]

const PRODUCTS = [
  { name: 'Small Batch Bourbon', sku: 'ST-SBB-750', stock: 1240, price: '$55.00', value: '$68,200', status: 'In Stock' },
  { name: 'Single Barrel Select', sku: 'ST-SBS-750', stock: 85, price: '$85.00', value: '$7,225', status: 'Low Stock' },
  { name: 'High Rye Bourbon', sku: 'ST-HRB-750', stock: 2100, price: '$48.00', value: '$100,800', status: 'In Stock' },
  { name: 'Cask Strength Rye', sku: 'ST-CSR-750', stock: 0, price: '$95.00', value: '$0', status: 'Out of Stock' },
  { name: 'Wheat Whiskey', sku: 'ST-WW-750', stock: 650, price: '$42.00', value: '$27,300', status: 'In Stock' },
]

export default function FinancePage() {
  const [activeTab, setActiveTab] = useState('summary')

  return (
    <div className="space-y-6">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Finance & Assets</h1>
          <p className="text-[var(--color-text-muted)] text-sm">Hearth & Hollow · Financial Performance</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </Button>
        </div>
      </header>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {METRICS.map((m) => (
          <Card key={m.label} className="flex flex-col gap-1">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs text-[var(--color-text-muted)] uppercase font-semibold">{m.label}</span>
              <m.icon className="w-4 h-4 text-primary" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{m.value}</p>
              <span className={`text-xs flex items-center ${m.trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
                {m.trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                {m.change}
              </span>
            </div>
          </Card>
        ))}
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

      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search products, SKUs, or barrels..."
              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
        </div>

        <Card className="p-0 overflow-hidden border-[var(--color-border)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[var(--color-bg-secondary)] border-b border-[var(--color-border)]">
                <tr>
                  <th className="px-6 py-3 font-semibold text-[var(--color-text-muted)]">Product Name</th>
                  <th className="px-6 py-3 font-semibold text-[var(--color-text-muted)]">SKU</th>
                  <th className="px-6 py-3 font-semibold text-[var(--color-text-muted)] text-right">Stock (Cases)</th>
                  <th className="px-6 py-3 font-semibold text-[var(--color-text-muted)] text-right">Wholesale Price</th>
                  <th className="px-6 py-3 font-semibold text-[var(--color-text-muted)] text-right">Inventory Value</th>
                  <th className="px-6 py-3 font-semibold text-[var(--color-text-muted)]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {PRODUCTS.map((p) => (
                  <tr key={p.sku} className="hover:bg-[var(--color-bg-secondary)]/50 transition-colors">
                    <td className="px-6 py-4 font-medium">{p.name}</td>
                    <td className="px-6 py-4 text-[var(--color-text-secondary)] font-mono text-xs">{p.sku}</td>
                    <td className="px-6 py-4 text-right">{p.stock}</td>
                    <td className="px-6 py-4 text-right font-medium">{p.price}</td>
                    <td className="px-6 py-4 text-right font-bold text-green-400">{p.value}</td>
                    <td className="px-6 py-4">
                      <Badge variant={
                        p.status === 'In Stock' ? 'success' : 
                        p.status === 'Low Stock' ? 'warning' : 'danger'
                      }>
                        {p.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  )
}
