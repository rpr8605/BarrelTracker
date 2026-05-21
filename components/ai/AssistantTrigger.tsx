'use client'
import { Button } from '@/components/ui/Button'
import { MessageSquare, Scan, Plus, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export function AssistantTrigger() {
  const openAssistant = () => {
    window.dispatchEvent(new CustomEvent('open-assistant'))
  }

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
      <Button 
        variant="secondary" 
        size="sm" 
        className="bg-[#18181b] border-zinc-800 text-zinc-300 hover:text-white shrink-0"
        onClick={openAssistant}
      >
        <MessageSquare className="w-4 h-4 mr-2 text-primary" />
        Ask Still
      </Button>
      <Link href="/scan">
        <Button variant="secondary" size="sm" className="bg-[#18181b] border-zinc-800 text-zinc-300 hover:text-white shrink-0">
          <Scan className="w-4 h-4 mr-2 text-primary" />
          Scan Barrel
        </Button>
      </Link>
      <Link href="/barrels/new">
        <Button variant="secondary" size="sm" className="bg-[#18181b] border-zinc-800 text-zinc-300 hover:text-white shrink-0">
          <Plus className="w-4 h-4 mr-2 text-primary" />
          Add Barrel
        </Button>
      </Link>
      <Link href="/admin">
        <Button variant="secondary" size="sm" className="bg-[#18181b] border-zinc-800 text-zinc-300 hover:text-white shrink-0">
          <ShieldCheck className="w-4 h-4 mr-2 text-primary" />
          Admin
        </Button>
      </Link>
    </div>
  )
}
