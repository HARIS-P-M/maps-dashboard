"use client"

import { motion } from "framer-motion"
import { GlassCard } from "@/components/dashboard/glass-card"
import { ReadinessRadar } from "@/components/dashboard/charts"
import { skillGap } from "@/lib/mock-data"
import { ArrowUpRight } from "lucide-react"

export function SkillGapSection() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <GlassCard className="p-6 lg:col-span-3">
          <h2 className="mb-1 text-lg font-semibold">Skill Gap Overview</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Current proficiency vs. required level for your target roles.
          </p>
          <div className="space-y-4">
            {skillGap.map((s, i) => {
              const gap = s.required - s.current
              const closed = gap <= 0
              return (
                <motion.div
                  key={s.skill}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{s.skill}</span>
                    <span className={closed ? "text-[var(--chart-2)]" : "text-[var(--chart-4)]"}>
                      {closed ? "On target" : `${gap}% gap`}
                    </span>
                  </div>
                  <div className="relative h-2.5 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="absolute inset-y-0 rounded-full bg-border"
                      style={{ width: `${s.required}%` }}
                      aria-hidden
                    />
                    <motion.div
                      className="absolute inset-y-0 rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${s.current}%` }}
                      transition={{ duration: 0.9, delay: 0.1 + i * 0.05 }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
          <div className="mt-5 flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-primary" /> Current
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-border" /> Required
            </span>
          </div>
        </GlassCard>

        <GlassCard className="p-6 lg:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">Readiness Profile</h2>
          <ReadinessRadar />
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Recommended Focus</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {["System Design", "Dynamic Programming", "Graphs"].map((f, i) => (
            <motion.button
              key={f}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.06 }}
              whileHover={{ y: -3 }}
              className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4 text-left transition-colors hover:border-primary/40"
            >
              <div>
                <p className="font-medium">{f}</p>
                <p className="text-xs text-muted-foreground">Coach-recommended</p>
              </div>
              <ArrowUpRight className="h-4 w-4 text-primary" />
            </motion.button>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
