'use client'

import { motion } from 'framer-motion'
import {
  TrendingUp,
  Flame,
  FileCheck2,
  Mic,
  ArrowUpRight,
  Check,
  Trophy,
  Lock,
  Zap,
} from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/dashboard/glass-card'
import { AnimatedCounter } from '@/components/dashboard/animated-counter'
import { RadialGauge } from '@/components/dashboard/radial-gauge'
import { AgentGraph } from '@/components/dashboard/agent-graph'
import { ProgressAreaChart, LanguageDonut } from '@/components/dashboard/charts'
import { codingProgress, languageSplit, achievements } from '@/lib/mock-data'
import type { ViewId } from '@/lib/nav'
import { useState, useEffect } from 'react'
import { useAuth } from '@/components/dashboard/auth-context'
import { useStore } from '@/lib/store'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

export function Overview({ onNavigate }: { onNavigate: (v: ViewId) => void }) {
  const { user } = useAuth()
  const {
    resumeText, jdText, targetRole, targetCompany,
    coachData, setCoachData, isGeneratingCoach, setIsGeneratingCoach,
    completedTaskIds, toggleTask,
    getLiveAtsScore, getLiveInterviewScore, getLiveAptitudeScore,
    getLivePlacementProb, getLiveStreak, getStudentContext,
  } = useStore()
  const [tasks, setTasks] = useState<any[]>([])

  // Load or Generate Coach Data
  useEffect(() => {
    let active = true

    async function fetchCoachData() {
      if (coachData) {
        setTasks(coachData.todaysTasks.map((t: any, i: number) => ({ ...t, id: i, done: false })))
        return
      }

      setIsGeneratingCoach(true)
      try {
        const res = await fetch('/api/agents/coach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            resumeText,
            jdText,
            targetRole,
            targetCompany,
            weeksToGenerate: 4,
            studentContext: getStudentContext(),   // ← Pass full intelligence context
          })
        })
        if (res.ok && active) {
          const data = await res.json()
          setCoachData(data)
          setTasks(data.todaysTasks.map((t: any, i: number) => ({ ...t, id: i, done: false })))
        }
      } catch (err) {
        console.error('Failed to load coach data', err)
      } finally {
        if (active) setIsGeneratingCoach(false)
      }
    }

    fetchCoachData()
    return () => { active = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [coachData])

  const toggle = (id: number) => {
    // Persist task completion to the store
    const taskKey = `today-${id}`
    toggleTask(taskKey)
    setTasks((t) => t.map((x) => (x.id === id ? { ...x, done: !x.done } : x)))
  }
  const doneCount = tasks.length > 0 ? tasks.filter((t) => t.done).length : 0

  // ── Live Stats from real performance data ───────────────────────────────────
  const liveAts = getLiveAtsScore()
  const liveInterview = getLiveInterviewScore()
  const livePlacement = getLivePlacementProb()
  const liveStreak = getLiveStreak()

  const stats = [
    {
      label: 'Placement Probability',
      value: livePlacement || (user?.stats.placementProb ?? 0),
      suffix: '%',
      delta: livePlacement > 0 ? 'Live AI score' : 'Upload resume',
      icon: TrendingUp, color: 'text-chart-1', bg: 'bg-chart-1/15',
    },
    {
      label: 'ATS Resume Score',
      value: liveAts || (user?.stats.atsScore ?? 0),
      suffix: '/100',
      delta: liveAts > 0 ? 'From last analysis' : 'Not analyzed',
      icon: FileCheck2, color: 'text-chart-2', bg: 'bg-chart-2/15',
    },
    {
      label: 'Interview Readiness',
      value: liveInterview || (user?.stats.interviewReadiness ?? 0),
      suffix: '%',
      delta: liveInterview > 0 ? 'From mock sessions' : 'No sessions yet',
      icon: Mic, color: 'text-chart-3', bg: 'bg-chart-3/15',
    },
    {
      label: 'Study Streak',
      value: liveStreak,
      suffix: liveStreak === 1 ? ' day' : ' days',
      delta: liveStreak > 0 ? 'Keep it up! 🔥' : 'Start today',
      icon: Flame, color: 'text-chart-5', bg: 'bg-chart-5/15',
    },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Stat row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} variants={item}>
              <GlassCard className="p-5">
                <div className="flex items-start justify-between">
                  <span className={`grid size-10 place-items-center rounded-xl ${s.bg} ${s.color}`}>
                    <Icon className="size-5" />
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                    <ArrowUpRight className="size-3" />
                    {s.delta}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-tight">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>

      {/* Probability gauge + coding progress */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <motion.div variants={item}>
          <GlassCard glow className="flex h-full flex-col items-center justify-center p-6 text-center">
            <p className="mb-4 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
              AI Placement Probability
            </p>
            <RadialGauge value={livePlacement || (user?.stats.placementProb ?? 0)} label="on track for offer" />
            <p className="mt-4 max-w-[16rem] text-pretty text-sm text-muted-foreground">
              {livePlacement > 0
                ? 'Computed live from your resume score, interview performance, aptitude accuracy, and coding stats.'
                : 'Upload your resume and start practicing to compute your real placement probability.'}
            </p>
          </GlassCard>
        </motion.div>

        <motion.div variants={item} className="lg:col-span-2">
          <GlassCard className="h-full p-6">
            <SectionHeading
              eyebrow="Coding Arena"
              title="Problems solved vs. target"
              action={
                <button
                  onClick={() => onNavigate('coding')}
                  className="flex items-center gap-1 text-sm text-primary hover:underline"
                >
                  Open arena <ArrowUpRight className="size-4" />
                </button>
              }
            />
            <ProgressAreaChart data={codingProgress} />
          </GlassCard>
        </motion.div>
      </div>

      {/* Agent graph */}
      <motion.div variants={item}>
        <GlassCard className="p-6">
          <SectionHeading
            eyebrow="Multi-Agent System"
            title="Live agent communication"
            action={
              <button
                onClick={() => onNavigate('agents')}
                className="flex items-center gap-1 text-sm text-primary hover:underline"
              >
                Inspect agents <ArrowUpRight className="size-4" />
              </button>
            }
          />
          <div className="overflow-hidden rounded-2xl border border-border/60">
            <AgentGraph height={360} />
          </div>
        </GlassCard>
      </motion.div>

      {/* Tasks + language + achievements */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Daily tasks */}
        <motion.div variants={item}>
          <GlassCard className="h-full p-6">
            <SectionHeading
              eyebrow={isGeneratingCoach ? 'Generating plan...' : `${doneCount}/${tasks.length} complete`}
              title="Today's personalized plan"
            />
            {isGeneratingCoach ? (
              <div className="flex h-32 items-center justify-center text-sm text-muted-foreground animate-pulse">
                Analyzing your resume...
              </div>
            ) : tasks.length === 0 ? (
              <div className="flex h-32 flex-col items-center justify-center text-center text-sm text-muted-foreground">
                <p>Upload a resume in the Analyzer</p>
                <p>to get your personalized plan.</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {tasks.map((t) => (
                  <li key={t.id}>
                    <button
                      onClick={() => toggle(t.id)}
                      className="flex w-full items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3 text-left transition-colors hover:bg-secondary/60"
                    >
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-md border transition-colors ${
                          t.done ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40'
                        }`}
                      >
                        {t.done && <Check className="size-3.5" />}
                      </span>
                      <span className={`flex-1 text-sm ${t.done ? 'text-muted-foreground line-through' : ''}`}>
                        {t.title}
                      </span>
                      <span className="flex items-center gap-1 font-mono text-[0.65rem] text-primary">
                        <Zap className="size-3" />
                        {t.xp || 20}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </GlassCard>
        </motion.div>

        {/* Language split */}
        <motion.div variants={item}>
          <GlassCard className="h-full p-6">
            <SectionHeading eyebrow="Practice mix" title="Languages used" />
            <LanguageDonut data={languageSplit} />
          </GlassCard>
        </motion.div>

        {/* Achievements */}
        <motion.div variants={item}>
          <GlassCard className="h-full p-6">
            <SectionHeading eyebrow="Milestones" title="Achievements" />
            <div className="grid grid-cols-2 gap-2.5">
              {achievements.map((a) => (
                <div
                  key={a.id}
                  className={`rounded-xl border p-3 ${
                    a.unlocked ? 'border-primary/30 bg-primary/10' : 'border-border/60 bg-secondary/20 opacity-70'
                  }`}
                >
                  <span
                    className={`grid size-8 place-items-center rounded-lg ${
                      a.unlocked ? 'bg-primary/20 text-primary' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    {a.unlocked ? <Trophy className="size-4" /> : <Lock className="size-4" />}
                  </span>
                  <p className="mt-2 text-xs font-semibold leading-tight">{a.title}</p>
                  <p className="mt-0.5 text-[0.7rem] leading-tight text-muted-foreground">{a.desc}</p>
                </div>
              ))}
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  )
}
