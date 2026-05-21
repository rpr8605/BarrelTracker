'use client'
import { useState } from 'react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { 
  MessageSquare, 
  X, 
  Send, 
  Sparkles, 
  Bot, 
  User,
  ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Message {
  role: 'assistant' | 'user'
  content: string
}

export function AskStillSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'assistant', 
      content: 'Hello William. I’m Still Assistant. How can I help you manage Hearth & Hollow today?' 
    }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim() || loading) return
    
    const userMsg = input
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    // Simulate AI thinking
    setTimeout(() => {
      let response = "I'm analyzing the distillery data for you..."
      
      if (userMsg.toLowerCase().includes('dashboard')) {
        response = "The dashboard shows a productivity score of 98/100. Production is up 12% this month. Your primary blockers are BL-007 (missing proof target) and B-104 (missing tasting note)."
      } else if (userMsg.toLowerCase().includes('barrel')) {
        response = "You have 600 active barrels. 148 are MGP sourced, and 37 are aged 10+ years. Barrel H&H-0104 is currently flagged for a final tasting note before its scheduled bottling in 10 days."
      } else if (userMsg.toLowerCase().includes('compliance')) {
        response = "Your current compliance confidence is 84/100. The primary issue is a missing COLA confirmation for the Spring Single Barrel release. Would you like me to draft a follow-up for Nancy?"
      } else {
        response = "I've logged your query. As this is a demo environment, I can provide insights on barrels, production health, and compliance readiness for Hearth & Hollow."
      }

      setMessages(prev => [...prev, { role: 'assistant', content: response }])
      setLoading(false)
    }, 1000)
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/40 backdrop-blur-sm z-50 transition-opacity duration-300 lg:hidden",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <aside className={cn(
        "fixed right-0 top-0 h-full w-full max-w-md bg-[#0c0c0e] border-l border-zinc-800 z-[60] shadow-2xl transition-transform duration-300 transform flex flex-col",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* Header */}
        <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-[#121214]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-primary">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-widest">Ask Still</h2>
              <p className="text-[10px] text-zinc-500 font-medium">H&H AI ASSISTANT V2.4</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-zinc-800 rounded-lg text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-hide">
          {messages.map((msg, i) => (
            <div key={i} className={cn(
              "flex gap-3 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}>
              <div className={cn(
                "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border",
                msg.role === 'assistant' 
                  ? "bg-primary/10 border-primary/20 text-primary" 
                  : "bg-zinc-800 border-zinc-700 text-zinc-400"
              )}>
                {msg.role === 'assistant' ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
              </div>
              <div className={cn(
                "p-3 rounded-2xl text-sm leading-relaxed",
                msg.role === 'assistant' 
                  ? "bg-zinc-900 text-zinc-300 border border-zinc-800" 
                  : "bg-primary text-white font-medium shadow-lg shadow-primary/10"
              )}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 max-w-[85%]">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center gap-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1 h-1 bg-primary rounded-full animate-bounce" />
              </div>
            </div>
          )}
        </div>

        {/* Suggested Queries */}
        <div className="p-4 bg-[#121214] border-t border-zinc-800">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-3">Suggested Questions</p>
          <div className="flex flex-wrap gap-2">
            {[
              "Why is my compliance score 84?",
              "Summarize Barrel H&H-0104",
              "Show blocked releases",
              "What happened today?"
            ].map((q) => (
              <button 
                key={q}
                onClick={() => setInput(q)}
                className="text-xs px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-400 hover:text-white hover:border-zinc-700 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-4 bg-[#121214] border-t border-zinc-800">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Type your question..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-4 pr-12 py-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-zinc-600 text-center mt-3 font-medium">
            Still AI can make mistakes. Verify critical compliance data.
          </p>
        </div>
      </aside>
    </>
  )
}
