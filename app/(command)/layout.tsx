import { ReactNode } from 'react'
import { Sidebar } from '@/components/command-center/Sidebar'

export default function CommandLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#050505] text-white flex">
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --color-bg: #050505;
          --color-bg-secondary: #0f0f0f;
          --color-surface: #141414;
          --color-border: #222222;
          --color-text: #ffffff;
          --color-text-secondary: #a0a0a0;
          --color-text-muted: #666666;
        }
        body {
          background-color: #050505;
          color: #ffffff;
        }
      `}} />
      
      <Sidebar />
      
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b border-[#222222] flex items-center justify-between px-6 bg-[#050505]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-semibold tracking-wider uppercase text-[#BA7517]">CEO Command Center</h1>
            <div className="h-4 w-[1px] bg-[#222222]" />
            <span className="text-xs text-[#666666] font-mono">NODE_BT_01</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex -space-x-2">
              {['R', 'N', 'G'].map((initial) => (
                <div key={initial} className="w-6 h-6 rounded-full bg-[#141414] border border-[#222222] flex items-center justify-center text-[10px] font-bold">
                  {initial}
                </div>
              ))}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
