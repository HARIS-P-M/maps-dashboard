"use client"

import { GlassCard } from "@/components/dashboard/glass-card"
import { CodingProgressChart, ProbabilityAreaChart, LanguagePie } from "@/components/dashboard/charts"
import { AnimatedCounter } from "@/components/dashboard/animated-counter"
import { motion } from "framer-motion"

const kpis = [
  { label: "Problems Solved", value: 74, suffix: "" },
  { label: "Avg. Accuracy", value: 78, suffix: "%" },
  { label: "Mock Interviews", value: 8, suffix: "" },
  { label: "Active Days", value: 32, suffix: "" },
]

export function AnalyticsSection() {
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
          <CodingProgressChart />
        </GlassCard>
        <GlassCard className="p-6">
          <h2 className="mb-4 text-lg font-semibold">Language Split</h2>
          <LanguagePie />
        </GlassCard>
      </div>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Placement Probability Trend</h2>
        <ProbabilityAreaChart />
      </GlassCard>
    </div>
  )
}
