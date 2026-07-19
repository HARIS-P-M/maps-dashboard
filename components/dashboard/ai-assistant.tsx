'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X, Send, Bot } from 'lucide-react'

type Msg = { role: 'user' | 'assistant'; text: string }

const canned = [
  'Based on your last 8 mock interviews, your biggest lever is System Design — I have queued 3 warm-up problems for you.',
  'Your placement probability rose 6% this month. Closing the DP skill gap would push it past 85%.',
  'I drafted 4 resume bullet rewrites to fix the ATS keyword gaps for Amazon SDE-1. Want to review them?',
  "You're 2 problems short of this week's target. A 25-minute focused session tonight keeps your streak alive.",
]

export function AiAssistant() {
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', text: "Hi Ananya — I'm ARIA, your placement copilot. Ask me anything about your prep." },
  ])
  const [typing, setTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, typing])

  const send = () => {
    const text = input.trim()
    if (!text) return
    setMessages((m) => [...m, { role: 'user', text }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages((m) => [...m, { role: 'assistant', text: canned[Math.floor(Math.random() * canned.length)] }])
    }, 1100)
  }

  return (
    <>
      <motion.button
        onClick={() => setOpen((o) => !o)}
        whileTap={{ scale: 0.92 }}
        whileHover={{ scale: 1.05 }}
        className="animate-pulse-ring fixed bottom-5 right-5 z-50 grid size-14 place-items-center rounded-full bg-primary text-primary-foreground shadow-[0_10px_40px_-8px_var(--glow)]"
        aria-label="Open AI assistant"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={open ? 'x' : 'spark'}
            initial={{ rotate: -90, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 90, opacity: 0 }}
          >
            {open ? <X className="size-6" /> : <Sparkles className="size-6" />}
          </motion.span>
        </AnimatePresence>
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="glass glow fixed bottom-24 right-5 z-50 flex h-[30rem] w-[calc(100vw-2.5rem)] max-w-sm flex-col overflow-hidden rounded-3xl"
            role="dialog"
            aria-label="ARIA assistant"
          >
            <div className="flex items-center gap-3 border-b border-border/60 p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
                <Bot className="size-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">ARIA</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className="size-1.5 rounded-full bg-success" /> Online · multi-agent
                </p>
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={
                      m.role === 'user'
                        ? 'max-w-[80%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2.5 text-sm text-primary-foreground'
                        : 'max-w-[85%] rounded-2xl rounded-bl-sm bg-secondary px-3.5 py-2.5 text-sm text-secondary-foreground'
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl bg-secondary px-4 py-3">
                    {[0, 1, 2].map((d) => (
                      <motion.span
                        key={d}
                        className="size-1.5 rounded-full bg-muted-foreground"
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-border/60 p-3">
              <div className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-1.5">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.nativeEvent.isComposing && e.keyCode !== 229) send()
                  }}
                  placeholder="Ask ARIA…"
                  aria-label="Message ARIA"
                  className="flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/70"
                />
                <button
                  onClick={send}
                  className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
                  disabled={!input.trim()}
                  aria-label="Send"
                >
                  <Send className="size-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
