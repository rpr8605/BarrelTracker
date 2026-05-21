'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { 
  FileText, 
  Download, 
  Clock, 
  Filter, 
  Search,
  Calendar,
  ChevronRight,
  FileSpreadsheet,
  FilePieChart,
  ShieldCheck,
  TrendingUp,
  Users,
  Warehouse,
  Flame,
  Droplets,
  DollarSign,
  History,
  X,
  ExternalLink,
  Eye
} from 'lucide-react'

const RECENT_REPORTS = [
  { id: '1', name: 'Monthly Tax Summary - March', date: '2 hours ago', type: 'PDF', size: '1.2 MB', status: 'Ready' },
  { id: '2', name: 'TTB Compliance Audit Prep', date: 'Yesterday', type: 'XLSX', size: '4.5 MB', status: 'Ready' },
  { id: '3', name: 'Barrel Loss Report Q1', date: '3 days ago', type: 'PDF', size: '840 KB', status: 'Ready' },
  { id: '4', name: 'Production Efficiency Analysis', date: '4 days ago', type: 'PDF', size: '2.1 MB', status: 'Ready' },
  { id: '5', name: 'Warehouse Rickhouse 4 Heatmap', date: '1 week ago', type: 'PDF', size: '3.8 MB', status: 'Ready' },
  { id: '6', name: 'Annual Financial Audit Export', date: '2 weeks ago', type: 'CSV', size: '12.4 MB', status: 'Archived' },
]

const REPORT_LIBRARY = [
  {
    category: 'Daily Operations',
    reports: [
      { id: 'do-1', name: 'Daily Executive Summary', description: 'Snapshot of yesterday\'s production, sales, and urgent alerts.', icon: FileText },
      { id: 'do-2', name: 'Shift Log Summary', description: 'Consolidated notes from all production shifts.', icon: Clock },
      { id: 'do-3', name: 'Material Usage Report', description: 'Daily grain, yeast, and enzyme consumption tracking.', icon: Droplets },
    ]
  },
  {
    category: 'Inventory & Assets',
    reports: [
      { id: 'ia-1', name: 'Master Barrel Inventory', description: 'Full list of all active and historical barrels with current status.', icon: Warehouse },
      { id: 'ia-2', name: 'Rickhouse Heatmap Data', description: 'Distribution of age, proof, and fill levels by location.', icon: FilePieChart },
      { id: 'ia-3', name: 'Yield Analysis', description: 'Detailed breakdown of distillation efficiency and barrel fill yields.', icon: FileSpreadsheet },
      { id: 'ia-4', name: 'Empty Barrel Stock', description: 'Inventory of incoming cooperage and storage locations.', icon: Warehouse },
      { id: 'ia-5', name: 'Aging Projection (5 Year)', description: 'Forecasted inventory maturation dates and volume.', icon: TrendingUp },
    ]
  },
  {
    category: 'Compliance & Regulatory',
    reports: [
      { id: 'cr-1', name: 'Monthly Operations Report (702)', description: 'Automated data for TTB Form 5110.40.', icon: ShieldCheck },
      { id: 'cr-2', name: 'Excise Tax Liability', description: 'Current and projected federal and state tax obligations.', icon: DollarSign },
      { id: 'cr-3', name: 'Chain of Custody Log', description: 'Complete audit trail for all spirit movements and transfers.', icon: History },
      { id: 'cr-4', name: 'DSP Permit Compliance', description: 'Summary of bond status, permit renewals, and reporting dates.', icon: ShieldCheck },
      { id: 'cr-5', name: 'Proof Adjustment Records', description: 'Gauging records for all dilution and proofing events.', icon: Droplets },
    ]
  },
  {
    category: 'Financial & Commercial',
    reports: [
      { id: 'fc-1', name: 'Projected Release Value', description: 'Current market valuation of the aging barrel pipeline.', icon: TrendingUp },
      { id: 'fc-2', name: 'Sales & Distribution', description: 'Case movement by region, SKU, and distributor.', icon: FileSpreadsheet },
      { id: 'fc-3', name: 'Cost of Goods Sold (COGS)', description: 'Detailed production cost analysis per proof gallon.', icon: DollarSign },
      { id: 'fc-4', name: 'Adoption Revenue Summary', description: 'Income from barrel sponsorship and adoption programs.', icon: Users },
    ]
  },
  {
    category: 'Quality & Tasting',
    reports: [
      { id: 'qt-1', name: 'Lab Analysis Results', description: 'Chemical analysis (congeners, esters) by batch.', icon: Flame },
      { id: 'qt-2', name: 'Sensory Panel Summary', description: 'Aggregated tasting notes and quality scores.', icon: Users },
      { id: 'qt-3', name: 'Maturation Profiles', description: 'Tracking flavor development curves across rickhouses.', icon: TrendingUp },
      { id: 'qt-4', name: 'Bottle Quality Audit', description: 'Packaging and labeling quality control records.', icon: FileText },
    ]
  }
]

export default function ReportsPortal() {
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredLibrary = REPORT_LIBRARY.map(group => ({
    ...group,
    reports: group.reports.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      r.description.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(group => group.reports.length > 0)

  return (
    <div className="space-y-6 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight text-white">Reports Portal</h1>
          <p className="text-[var(--color-text-muted)] text-sm">Hearth & Hollow · Regulatory & Business Intelligence</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" className="flex items-center gap-2 bg-[#1a1510] border-[#2a2520] text-zinc-300">
            <Calendar className="w-4 h-4" />
            Date Range
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary-dark text-white border-none">Generate Custom Report</Button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Library */}
        <div className="lg:col-span-2 space-y-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]" />
            <input
              type="text"
              placeholder="Search 20+ reports..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121212] border border-[#222] rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-white"
            />
          </div>

          <div className="space-y-8">
            {filteredLibrary.map((group) => (
              <div key={group.category} className="space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-widest text-primary ml-1">
                  {group.category}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.reports.map((report) => (
                    <Card 
                      key={report.id} 
                      className="bg-[#121212] border-[#222] hover:border-primary/50 transition-all cursor-pointer group"
                      onClick={() => setSelectedReport(report)}
                    >
                      <div className="flex gap-4 p-4">
                        <div className="p-3 bg-zinc-900 rounded-lg group-hover:bg-primary/10 transition-colors shrink-0">
                          <report.icon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white group-hover:text-primary transition-colors">{report.name}</h4>
                          <p className="text-xs text-[var(--color-text-muted)] mt-1 leading-relaxed">
                            {report.description}
                          </p>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recently Generated */}
        <div className="space-y-6">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2 text-white">
              <Clock className="w-5 h-5 text-primary" />
              Recently Generated
            </h2>
            <Card className="divide-y divide-[#222] p-0 bg-[#121212] border-[#222] overflow-hidden">
              {RECENT_REPORTS.map((report) => (
                <div key={report.id} className="p-4 hover:bg-zinc-900/50 transition-colors group relative">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-sm font-medium text-zinc-200 group-hover:text-white">{report.name}</h4>
                    <Badge className={report.status === 'Archived' ? 'bg-zinc-800 text-zinc-400' : 'bg-primary/10 text-primary border-primary/20'}>
                      {report.type}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center text-xs text-[var(--color-text-muted)]">
                    <span>{report.date} · {report.size}</span>
                    <div className="flex gap-3">
                      <button className="text-zinc-400 hover:text-white transition-colors">
                        <Download className="w-4 h-4" />
                      </button>
                      <button className="text-zinc-400 hover:text-white transition-colors" onClick={() => setSelectedReport(report)}>
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              <div className="p-4">
                <Button variant="secondary" size="sm" className="w-full bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white">
                  View All Activity
                </Button>
              </div>
            </Card>
          </div>

          {/* Scheduled Reports */}
          <Card className="bg-primary/5 border-primary/20 p-5">
            <h4 className="text-sm font-bold flex items-center gap-2 mb-4 text-primary">
              <Calendar className="w-4 h-4" />
              Next Scheduled
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-white">Inventory Audit</p>
                  <p className="text-[10px] text-zinc-500">Weekly Summary</p>
                </div>
                <span className="text-xs font-bold text-primary">Tomorrow, 08:00</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <p className="text-xs font-medium text-white">Tax Liability</p>
                  <p className="text-[10px] text-zinc-500">Monthly Filing</p>
                </div>
                <span className="text-xs font-bold text-primary">Monday, 09:00</span>
              </div>
            </div>
            <Button variant="ghost" className="w-full mt-4 text-xs text-primary hover:bg-primary/10 h-8">
              Manage Schedules
            </Button>
          </Card>

          {/* Report Analytics */}
          <Card className="bg-[#121212] border-[#222] p-5">
            <h4 className="text-sm font-bold flex items-center gap-2 mb-4 text-white">
              <TrendingUp className="w-4 h-4 text-success" />
              Usage Insights
            </h4>
            <div className="space-y-4">
              <div className="p-3 bg-zinc-900/50 rounded-lg border border-[#222]">
                <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest">Most Requested</p>
                <p className="text-sm font-bold text-white mt-1">Master Barrel Inventory</p>
                <p className="text-[10px] text-primary mt-0.5">Used in 85% of sessions</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-900/50 rounded-lg border border-[#222]">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">Generated</p>
                  <p className="text-lg font-bold text-white text-center mt-1">142</p>
                  <p className="text-[10px] text-success text-center">Last 30 days</p>
                </div>
                <div className="p-3 bg-zinc-900/50 rounded-lg border border-[#222]">
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest text-center">Automated</p>
                  <p className="text-lg font-bold text-white text-center mt-1">28</p>
                  <p className="text-[10px] text-primary text-center">Recurring</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Mock Viewer Modal */}
      {selectedReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <Card className="w-full max-w-5xl max-h-[90vh] bg-[#0f0c08] border-[#222] flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#222] bg-[#121212]">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{selectedReport.name}</h3>
                  <p className="text-xs text-zinc-500">Generated on {selectedReport.date || 'Demand'} · System Preview</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" className="bg-zinc-800 border-zinc-700 text-zinc-300 gap-2">
                  <Download className="w-4 h-4" />
                  Download {selectedReport.type || 'PDF'}
                </Button>
                <Button variant="secondary" size="sm" className="bg-zinc-800 border-zinc-700 text-zinc-300" onClick={() => setSelectedReport(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="flex-1 overflow-auto p-8 bg-[#f9f7f4]">
              {/* Mock Report Content */}
              <div className="max-w-4xl mx-auto bg-white shadow-sm border border-zinc-200 p-12 text-zinc-900 min-h-[1000px]">
                <div className="flex justify-between items-start border-b-2 border-zinc-900 pb-8 mb-8">
                  <div>
                    <h1 className="text-3xl font-serif font-bold italic text-zinc-800">HEARTH & HOLLOW</h1>
                    <p className="text-sm tracking-widest uppercase font-bold text-zinc-500">Distillery Operations</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">{selectedReport.name}</p>
                    <p className="text-xs text-zinc-500">Report ID: {selectedReport.id || 'GEN-842-X'}</p>
                    <p className="text-xs text-zinc-500">Date: {new Date().toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-8 mb-12">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Parameter</p>
                    <p className="text-sm font-medium">Date Range: Last 30 Days</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Generated By</p>
                    <p className="text-sm font-medium">System (Automated)</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-zinc-400">Classification</p>
                    <p className="text-sm font-medium">Internal / Regulatory</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="h-64 bg-zinc-50 rounded-lg border border-zinc-100 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 flex items-end px-8 pb-8 gap-4">
                      <div className="flex-1 bg-zinc-200 h-1/2 rounded-t"></div>
                      <div className="flex-1 bg-primary/40 h-2/3 rounded-t"></div>
                      <div className="flex-1 bg-zinc-200 h-1/3 rounded-t"></div>
                      <div className="flex-1 bg-primary h-full rounded-t"></div>
                      <div className="flex-1 bg-zinc-200 h-1/2 rounded-t"></div>
                      <div className="flex-1 bg-primary/60 h-3/4 rounded-t"></div>
                    </div>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest relative z-10">Data Visualization Preview</p>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-bold border-b border-zinc-200 pb-2">Executive Summary</h4>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      This report provides a comprehensive analysis of the {selectedReport.category || 'requested'} operations. 
                      Preliminary data indicates a 4.2% increase in efficiency compared to the previous reporting period. 
                      All compliance markers are currently within acceptable federal limits.
                    </p>
                  </div>

                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-zinc-900 text-left">
                        <th className="py-2">Metric</th>
                        <th className="py-2 text-right">Current</th>
                        <th className="py-2 text-right">Previous</th>
                        <th className="py-2 text-right">Delta</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {[1,2,3,4,5].map(i => (
                        <tr key={i}>
                          <td className="py-3 text-zinc-500 font-medium">Operational KPI #{i}</td>
                          <td className="py-3 text-right font-bold">{(Math.random() * 1000).toFixed(2)}</td>
                          <td className="py-3 text-right">{(Math.random() * 1000).toFixed(2)}</td>
                          <td className="py-3 text-right text-success font-medium">+{ (Math.random() * 5).toFixed(1) }%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="mt-20 pt-8 border-t border-zinc-100 text-[10px] text-zinc-400 flex justify-between">
                  <p>© Hearth & Hollow Distillery Management System</p>
                  <p>Page 1 of 12</p>
                  <p>Confidential</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
