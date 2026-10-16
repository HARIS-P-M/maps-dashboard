"use client"

import { GlassCard } from "@/components/dashboard/glass-card"
import { ProgressAreaChart, ProbabilityLine } from "@/components/dashboard/charts"
import { AnimatedCounter } from "@/components/dashboard/animated-counter"
import { motion } from "framer-motion"
import { useAuth } from "@/components/dashboard/auth-context"
import { useStore } from "@/lib/store"

export function AnalyticsSection() {
  const { user } = useAuth()
  const { codingSessions, interviewHistory, aptitudeStats } = useStore()
  const kpis = [
    { label: "Problems Solved", value: user?.stats.problemsSolved ?? codingSessions.length, suffix: "" },
    { label: "Avg. Accuracy", value: user?.stats.accuracy ?? (aptitudeStats.total ? Math.round(aptitudeStats.correct / aptitudeStats.total * 100) : 0), suffix: "%" },
    { label: "Mock Interviews", value: user?.stats.mockInterviews ?? interviewHistory.length, suffix: "" },
    { label: "Active Days", value: user?.stats.activeDays ?? 0, suffix: "" },
  ]
  const codingProgress = codingSessions.length
    ? codingSessions.map((session, index) => ({ week: `#${index + 1}`, solved: session.passed ? 1 : 0, target: 1 }))
    : []

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard className="p-5">
              <p className="text-sm text-muted-foreground">{k.label}</p>
              <p className="mt-2 text-3xl font-semibold tracking-tight">
                <AnimatedCounter value={k.value} />
                {k.suffix}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        <GlassCard className="p-6 xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Coding Progress vs. Target</h2>
          {codingProgress.length ? <ProgressAreaChart data={codingProgress} /> : <EmptyState text="Complete coding sessions to see progress." />}
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Language Split</h2>
          <EmptyState text="Language usage will appear after coding activity." />
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Placement Probability Trend</h2>
        <EmptyState text="Probability history will appear after your first measured activity." />
      </GlassCard>
    </div>
  )
}

function EmptyState({ text }: { text: string }) {
  return <div className="flex h-48 items-center justify-center text-center text-sm text-muted-foreground">{text}</div>
}
