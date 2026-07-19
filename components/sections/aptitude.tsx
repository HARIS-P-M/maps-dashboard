'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { CheckCircle2, XCircle, Timer, Brain } from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/dashboard/glass-card'
import { AnimatedCounter } from '@/components/dashboard/animated-counter'
import { aptitudeTopics } from '@/lib/mock-data'

const question = {
  q: 'A train 120m long travels at 54 km/h. How long does it take to pass a platform 180m long?',
  options: ['15 s', '20 s', '25 s', '30 s'],
  correct: 1,
}

export function Aptitude() {
  const [picked, setPicked] = useState<number | null>(null)
  const answered = picked !== null

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Topic mastery */}
      <div className="space-y-4 lg:col-span-1">
        {aptitudeTopics.map((t) => (
          <GlassCard key={t.topic} className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">{t.topic}</p>
              <span className="font-mono text-sm text-primary">{t.accuracy}%</span>
            </div>
            <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-secondary">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                whileInView={{ width: `${t.accuracy}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1 }}
              />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{t.attempted} questions attempted</p>
          </GlassCard>
        ))}
      </div>

      {/* Active drill */}
      <div className="space-y-4 lg:col-span-2">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Streak', value: 12, icon: Brain, suffix: '' },
            { label: 'Accuracy', value: 76, icon: CheckCircle2, suffix: '%' },
            { label: 'Avg. time', value: 42, icon: Timer, suffix: 's' },
          ].map((s) => {
            const Icon = s.icon
            return (
              <GlassCard key={s.label} className="p-4 text-center">
                <Icon className="mx-auto mb-2 size-5 text-primary" />
                <p className="text-xl font-semibold">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </GlassCard>
            )
          })}
        </div>

        <GlassCard className="p-6">
          <SectionHeading eyebrow="Quantitative · Time, Speed & Distance" title="Question 7 of 15" />
          <p className="text-pretty text-base">{question.q}</p>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {question.options.map((opt, i) => {
              const isCorrect = i === question.correct
              const state = !answered
                ? 'idle'
                : isCorrect
                  ? 'correct'
                  : i === picked
                    ? 'wrong'
                    : 'idle'
              return (
                <button
                  key={i}
                  disabled={answered}
                  onClick={() => setPicked(i)}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                    state === 'correct'
                      ? 'border-success/50 bg-success/15 text-foreground'
                      : state === 'wrong'
                        ? 'border-destructive/50 bg-destructive/15 text-foreground'
                        : 'border-border bg-secondary/30 hover:border-primary/50'
                  }`}
                >
                  <span>{opt}</span>
                  {state === 'correct' && <CheckCircle2 className="size-4 text-success" />}
                  {state === 'wrong' && <XCircle className="size-4 text-destructive" />}
                </button>
              )
            })}
          </div>
          {answered && (
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-xl bg-secondary/40 p-3 text-sm text-muted-foreground"
            >
              Correct answer: <span className="text-success">20 s</span>. Total distance = 120 + 180 = 300m; speed = 54
              km/h = 15 m/s; time = 300 / 15 = 20 s.
            </motion.p>
          )}
        </GlassCard>
      </div>
    </div>
  )
}
