'use client'
import { useEffect, useRef, useState } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'

const GREETING = { role: 'assistant', content: "hey! 👋 I'm the DMForge assistant. Ask me anything about building AI DM setters, pricing, or getting set up." }

export function SupportChat() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState([GREETING])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, open])

  async function send(e) {
    e?.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    const next = [...messages, { role: 'user', content: text }]
    setMessages(next)
    setInput('')
    setBusy(true)
    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // The greeting is client-side only; the API wants the real conversation
        body: JSON.stringify({ messages: next.slice(1).slice(-20) }),
      })
      const data = await res.json().catch(() => null)
      if (!res.ok || !data?.reply) throw new Error(data?.error || 'request failed')
      setMessages(m => [...m, { role: 'assistant', content: data.reply }])
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Sorry — something went wrong on my end. Email us at support@dmforge.org and a human will help.' }])
    } finally { setBusy(false) }
  }

  return (
    <>
      {open && (
        <div className="fixed bottom-24 right-5 z-50 w-[min(24rem,calc(100vw-2.5rem))] rounded-2xl border border-[#2A2A55] bg-[#161630] shadow-2xl shadow-black/50 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#2A2A55]/60">
            <div>
              <p className="font-semibold text-sm">DMForge Support</p>
              <p className="text-xs text-[#A0A0C8]">Usually replies instantly · <a href="mailto:support@dmforge.org" className="underline hover:text-[#F5F5FA]">email us</a></p>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close support chat" className="text-[#A0A0C8] hover:text-[#F5F5FA]">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3 max-h-80 min-h-48 text-sm">
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={m.role === 'user'
                  ? 'bg-[#6B5BFF] text-white rounded-2xl rounded-br-sm px-3 py-2 max-w-[85%]'
                  : 'bg-[#1F1F42] text-[#F5F5FA] rounded-2xl rounded-bl-sm px-3 py-2 max-w-[85%]'}>
                  {m.content}
                </div>
              </div>
            ))}
            {busy && <p className="text-xs text-[#A0A0C8] animate-pulse">typing…</p>}
          </div>
          <form onSubmit={send} className="flex items-center gap-2 border-t border-[#2A2A55]/60 px-3 py-2.5">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ask about DMForge…"
              maxLength={1000}
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-[#A0A0C8]/60"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Send message" className="text-[#6B5BFF] disabled:text-[#2A2A55] hover:text-[#7C6DFF]">
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label={open ? 'Close support chat' : 'Open support chat'}
        className="fixed bottom-5 right-5 z-50 w-14 h-14 rounded-full bg-[#6B5BFF] hover:bg-[#7C6DFF] text-white shadow-lg shadow-[#6B5BFF]/30 flex items-center justify-center transition-colors"
      >
        {open ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </button>
    </>
  )
}
