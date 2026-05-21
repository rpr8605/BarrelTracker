'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  LayoutDashboard, 
  BarChart3, 
  Settings, 
  Users, 
  Target, 
  Zap, 
  Network,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { label: 'Overview', icon: LayoutDashboard, href: '/command' },
  { label: 'Pipeline', icon: Target, href: '/command/pipeline' },
  { label: 'Operations', icon: Zap, href: '/command/ops' },
  { label: 'Network', icon: Network, href: '/command/network' },
]

export function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside className={cn(
      "h-screen border-r border-[#222222] bg-[#0a0a0a] flex flex-col transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="h-14 flex items-center justify-between px-4 border-b border-[#222222]">
        {!collapsed && <span className="font-bold tracking-tighter text-xl">STILL<span className="text-[#BA7517]">OS</span></span>}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-[#1a1a1a] rounded text-[#666666] hover:text-white"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md transition-colors group",
                active 
                  ? "bg-[#BA7517]/10 text-[#BA7517]" 
                  : "text-[#a0a0a0] hover:text-white hover:bg-[#141414]"
              )}
            >
              <item.icon size={20} className={cn(
                "shrink-0",
                active ? "text-[#BA7517]" : "text-[#666666] group-hover:text-[#a0a0a0]"
              )} />
              {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
              {active && !collapsed && <div className="ml-auto w-1 h-4 bg-[#BA7517] rounded-full" />}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-[#222222] space-y-4">
        {!collapsed && (
          <div className="bg-[#141414] rounded-lg p-3 border border-[#222222]">
            <p className="text-[10px] uppercase tracking-widest text-[#666666] mb-2">System Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-xs font-mono text-green-500/80">ALL SYSTEMS NOMINAL</span>
            </div>
          </div>
        )}
        <Link 
          href="/" 
          className="flex items-center gap-3 px-3 py-2 text-[#666666] hover:text-white transition-colors"
        >
          <Settings size={20} />
          {!collapsed && <span className="text-sm font-medium">Exit to App</span>}
        </Link>
      </div>
    </aside>
  )
}
