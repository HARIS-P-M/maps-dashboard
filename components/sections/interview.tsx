'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Video, Mic, Square, Circle, Play, Bot } from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/dashboard/glass-card'

const metrics = [
  { label: 'Clarity', value: 82 },
  { label: 'Confidence', value: 74 },
  { label: 'Pacing', value: 68 },
  { label: 'Filler words', value: 88 },
]

const questions = [
  'Tell me about a time you handled a production incident.',
  'Design a URL shortener. Walk me through the data model.',
  'Why do you want to join our team specifically?',
]

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

export function Interview() {
  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [q, setQ] = useState(0)

  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [recording])

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {/* Recorder */}
        <GlassCard className="overflow-hidden">
          <div className="relative grid aspect-video place-items-center bg-gradient-to-br from-secondary/60 to-background">
            <div className="grid-bg absolute inset-0 opacity-40" />
            <div className="relative flex flex-col items-center gap-4">
              <motion.div
                animate={recording ? { scale: [1, 1.08, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.6 }}
                className="grid size-24 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30"
              >
                <Video className="size-10" />
              </motion.div>
              <p className="text-sm text-muted-foreground">
                {recording ? 'Recording your response…' : 'Camera & mic ready'}
              </p>
            </div>

            {recording && (
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-destructive/20 px-3 py-1 text-xs font-medium text-destructive">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="size-2 rounded-full bg-destructive"
                />
                REC {fmt(seconds)}
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-3 p-5">
            <button
              onClick={() => {
                setRecording((r) => !r)
                if (recording) setSeconds(0)
              }}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
                recording
                  ? 'bg-destructive text-white'
                  : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
            >
              {recording ? <Square className="size-4" /> : <Circle className="size-4" />}
              {recording ? 'Stop recording' : 'Start recording'}
            </button>
            <button className="grid size-10 place-items-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground">
              <Mic className="size-4" />
            </button>
            <button className="grid size-10 place-items-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground">
              <Play className="size-4" />
            </button>
          </div>
        </GlassCard>

        {/* Question prompt */}
        <GlassCard className="p-6">
          <SectionHeading eyebrow={`Question ${q + 1} of ${questions.length}`} title="Interview Agent asks" />
          <div className="flex items-start gap-3 rounded-xl bg-secondary/40 p-4">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
              <Bot className="size-5" />
            </span>
            <p className="text-pretty text-base">{questions[q]}</p>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <button
              onClick={() => setQ((v) => Math.max(0, v - 1))}
              className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary"
            >
              Previous
            </button>
            <button
              onClick={() => setQ((v) => Math.min(questions.length - 1, v + 1))}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Next question
            </button>
          </div>
        </GlassCard>
      </div>

      {/* AI feedback */}
      <GlassCard className="h-fit p-6">
        <SectionHeading eyebrow="Last session" title="AI feedback" />
        <div className="mb-5 flex items-baseline gap-2">
          <span className="text-4xl font-semibold text-primary">8.2</span>
          <span className="text-sm text-muted-foreground">/ 10 overall</span>
        </div>
        <div className="space-y-4">
          {metrics.map((m) => (
            <div key={m.label}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span>{m.label}</span>
                <span className="font-mono text-muted-foreground">{m.value}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${m.value}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="mt-5 rounded-xl bg-secondary/40 p-3 text-sm text-muted-foreground">
          Great structure using STAR. Reduce filler words (&quot;um&quot;, &quot;like&quot;) and slow your pacing by ~10%
          for stronger delivery.
        </p>
      </GlassCard>
    </div>
  )
}
