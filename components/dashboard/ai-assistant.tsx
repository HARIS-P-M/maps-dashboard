'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Sparkles, X, Send, Bot, AlertCircle } from 'lucide-react'
import { useAuth } from '@/components/dashboard/auth-context'
import { useStreamingAgent } from '@/lib/agents/use-agent'

type Msg = { role: 'user' | 'assistant'; text: string }

const WELCOME_MSG = "Hi! I'm ARIA, your AI placement copilot powered by Llama 3.1. Ask me anything about your prep — coding, resume, interviews, or which companies to target."

export function AiAssistant() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', text: WELCOME_MSG },
  ])
  const scrollRef = useRef<HTMLDivElement>(null)

  // Real streaming agent hook
  const { stream, isLoading, error, streamText } = useStreamingAgent()

  // Track current streaming message index
  const streamingIndexRef = useRef<number | null>(null)

  // Auto-scroll on new messages or stream chunks
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, streamText, isLoading])

  // Update the streaming assistant bubble in real-time
  useEffect(() => {
    if (streamingIndexRef.current !== null && streamText) {
      setMessages((prev) => {
        const updated = [...prev]
        updated[streamingIndexRef.current!] = {
          role: 'assistant',
          text: streamText,
        }
        return updated
      })
    }
  }, [streamText])

  const send = async () => {
    const text = input.trim()
    if (!text || isLoading) return

    // Add user message
    const userMsg: Msg = { role: 'user', text }
    const placeholderMsg: Msg = { role: 'assistant', text: '' }

    setMessages((prev) => {
      const next = [...prev, userMsg, placeholderMsg]
      streamingIndexRef.current = next.length - 1
      return next
    })
    setInput('')

    // Build history (exclude the empty placeholder we just added)
    const history = [...messages, userMsg].map((m) => ({
      role: m.role,
      text: m.text,
    }))

    // Call real Groq streaming API with user stats as context
    await stream(text, history, user?.stats as Record<string, unknown> | undefined)

    // Done streaming — lock in the final message
    streamingIndexRef.current = null
  }

  return (
    <>
      {/* Floating trigger button */}
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

      {/* Chat panel */}
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
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-border/60 p-4">
              <span className="grid size-9 place-items-center rounded-xl bg-primary/15 text-primary">
                <Bot className="size-5" />
              </span>
              <div className="flex-1">
                <p className="text-sm font-semibold">ARIA</p>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <span className={`size-1.5 rounded-full ${isLoading ? 'bg-yellow-400 animate-pulse' : 'bg-success'}`} />
                  {isLoading ? 'Thinking…' : 'Online · Groq / Llama 3.1'}
                </p>
              </div>
            </div>

            {/* Messages */}
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
                    {m.text || (
                      /* Typing dots while streaming starts */
                      <span className="flex gap-1">
                        {[0, 1, 2].map((d) => (
                          <motion.span
                            key={d}
                            className="size-1.5 rounded-full bg-muted-foreground"
                            animate={{ opacity: [0.3, 1, 0.3] }}
                            transition={{ duration: 1, repeat: Infinity, delay: d * 0.2 }}
                          />
                        ))}
                      </span>
                    )}
                  </div>
                </div>
              ))}

              {/* Error state */}
              {error && (
                <div className="flex items-center gap-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {error.includes('GROQ_API_KEY')
                    ? 'Add your GROQ_API_KEY to .env.local to enable ARIA.'
                    : error}
                </div>
              )}
            </div>

            {/* Input */}
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
                  disabled={isLoading}
                  className="flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-muted-foreground/70 disabled:opacity-50"
                />
                <button
                  onClick={send}
                  className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground disabled:opacity-40"
                  disabled={!input.trim() || isLoading}
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
