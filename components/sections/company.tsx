"use client"

import { motion } from "framer-motion"
import { Building2, Target, TrendingUp, CheckCircle2, Circle, Clock } from "lucide-react"
import { GlassCard } from "@/components/dashboard/glass-card"
import { companies, companyTimeline } from "@/lib/mock-data"

function DifficultyBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Hard: "bg-[var(--chart-4)]/15 text-[var(--chart-4)]",
    Medium: "bg-[var(--chart-3)]/15 text-[var(--chart-3)]",
    Easy: "bg-[var(--chart-2)]/15 text-[var(--chart-2)]",
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[level] ?? map.Medium}`}>
      {level}
    </span>
  )
}

export function CompanySection() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {companies.map((c, i) => (
          <motion.div
            key={c.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
          >
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ backgroundColor: `color-mix(in oklch, ${c.accent} 18%, transparent)` }}
                >
                  <Building2 className="h-5 w-5" style={{ color: c.accent }} />
                </div>
                <DifficultyBadge level={c.difficulty} />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{c.name}</h3>
              <p className="text-sm text-muted-foreground">{c.role}</p>
              <div className="mt-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Profile match</span>
                  <span className="font-semibold" style={{ color: c.accent }}>
                    {c.match}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ backgroundColor: c.accent }}
                    initial={{ width: 0 }}
                    animate={{ width: `${c.match}%` }}
                    transition={{ duration: 1, delay: 0.2 + i * 0.06 }}
                  />
                </div>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Clock className="h-3.5 w-3.5" />
                {c.window}
              </p>
            </GlassCard>
          </motion.div>
        ))}
      </div>

      <GlassCard className="p-6">
        <div className="mb-6 flex items-center gap-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Amazon SDE-1 — Preparation Timeline</h2>
        </div>
        <div className="relative pl-6">
          <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" aria-hidden />
          <ol className="space-y-6">
            {companyTimeline.map((t, i) => {
              const Icon = t.status === "done" ? CheckCircle2 : t.status === "active" ? Clock : Circle
              const color =
                t.status === "done"
                  ? "var(--chart-2)"
                  : t.status === "active"
                    ? "var(--primary)"
                    : "var(--muted-foreground)"
              return (
                <motion.li
                  key={t.phase}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="relative"
                >
                  <span
                    className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-card"
                    style={{ color }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-medium">{t.phase}</h3>
                    <span className="text-xs text-muted-foreground">{t.date}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{t.detail}</p>
                </motion.li>
              )
            })}
          </ol>
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Company Agent Insights</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Based on your profile, Amazon is your strongest near-term target. Prioritize behavioral prep on Leadership
          Principles and 2 more graph problems to close the gap for Google.
        </p>
      </GlassCard>
    </div>
  )
}
