'use client'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import type { ChatMessage } from '@/types/api'

export function ChatPanel() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function send() {
    if (!input.trim() || loading) return
    const userMsg: ChatMessage = { role: 'user', content: input.trim() }
    setMessages((m) => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.response }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Something went wrong. Try again.' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 md:bottom-6 z-50 w-14 h-14 bg-primary text-white rounded-full shadow-lg hover:bg-primary-dark transition-all flex items-center justify-center text-xl"
        aria-label="Open assistant"
      >
        ✦
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center md:justify-end p-4 md:pr-6">
          <div className="absolute inset-0 bg-black/20" onClick={() => setOpen(false)} />
          <div className="relative w-full md:w-96 h-[70vh] flex flex-col card overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
              <div>
                <div className="font-medium text-sm">Still Assistant</div>
                <div className="text-xs text-[var(--color-text-muted)]">Ask anything about your barrels</div>
              </div>
              <button onClick={() => setOpen(false)} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">✦</div>
                  <p className="text-sm text-[var(--color-text-muted)]">Ask me about your barrels, tasting schedules, blending ideas, or angel's share.</p>
                </div>
              )}
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
                    m.role === 'user'
                      ? 'bg-primary text-white rounded-br-sm'
                      : 'bg-[var(--color-bg-secondary)] text-[var(--color-text)] rounded-bl-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="px-3 py-2 rounded-xl bg-[var(--color-bg-secondary)] text-[var(--color-text-muted)] text-sm">
                    AI is thinking...
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="p-3 border-t border-[var(--color-border)] flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && send()}
                placeholder="Ask about your barrels..."
                className="flex-1 px-3 py-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] text-sm outline-none focus:border-primary min-h-[44px]"
              />
              <Button onClick={send} disabled={!input.trim()} size="sm" className="px-3">Send</Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
