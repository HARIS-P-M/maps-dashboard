"use client"

import { motion } from "framer-motion"
import { GlassCard } from "@/components/dashboard/glass-card"
import { leaderboard } from "@/lib/mock-data"
import { Crown, Flame, TrendingUp, TrendingDown, Minus } from "lucide-react"

function Delta({ delta }: { delta: number }) {
  if (delta > 0)
    return (
      <span className="flex items-center gap-0.5 text-xs text-[var(--chart-2)]">
        <TrendingUp className="h-3.5 w-3.5" />
        {delta}
      </span>
    )
  if (delta < 0)
    return (
      <span className="flex items-center gap-0.5 text-xs text-[var(--chart-4)]">
        <TrendingDown className="h-3.5 w-3.5" />
        {Math.abs(delta)}
      </span>
    )
  return (
    <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
      <Minus className="h-3.5 w-3.5" />
    </span>
  )
}

export function LeaderboardSection() {
  const top3 = leaderboard.slice(0, 3)
  const order = [top3[1], top3[0], top3[2]]
  const heights = ["h-24", "h-32", "h-20"]

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h2 className="mb-6 text-lg font-semibold">Cohort Leaderboard</h2>
        <div className="flex items-end justify-center gap-3 sm:gap-6">
          {order.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex w-24 flex-col items-center sm:w-32"
            >
              <div className="relative mb-2">
                <div
                  className={`flex h-14 w-14 items-center justify-center rounded-full text-lg font-semibold ${
                    p.self ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                  }`}
                >
                  {p.name === "You" ? "You" : p.name.charAt(0)}
                </div>
                {p.rank === 1 && (
                  <Crown className="absolute -top-4 left-1/2 h-5 w-5 -translate-x-1/2 text-[var(--chart-3)]" />
                )}
              </div>
              <p className="truncate text-sm font-medium">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.xp.toLocaleString()} XP</p>
              <div
                className={`mt-2 flex w-full items-start justify-center rounded-t-lg bg-gradient-to-t from-primary/10 to-primary/40 pt-2 text-sm font-bold ${heights[i]}`}
              >
                #{p.rank}
              </div>
            </motion.div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="overflow-hidden">
        <div className="grid grid-cols-[auto_1fr_auto_auto_auto] gap-4 border-b border-border px-6 py-3 text-xs uppercase tracking-wide text-muted-foreground">
          <span>Rank</span>
          <span>Student</span>
          <span className="text-right">XP</span>
          <span className="text-right">Streak</span>
          <span className="text-right">Trend</span>
        </div>
        {leaderboard.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
            className={`grid grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 px-6 py-3 text-sm ${
              p.self ? "bg-primary/10" : "hover:bg-secondary/40"
            } transition-colors`}
          >
            <span className="w-6 font-semibold text-muted-foreground">{p.rank}</span>
            <span className={`font-medium ${p.self ? "text-primary" : ""}`}>{p.name}</span>
            <span className="text-right tabular-nums">{p.xp.toLocaleString()}</span>
            <span className="flex items-center justify-end gap-1 text-right tabular-nums">
              <Flame className="h-3.5 w-3.5 text-[var(--chart-3)]" />
              {p.streak}
            </span>
            <span className="flex justify-end">
              <Delta delta={p.delta} />
            </span>
          </motion.div>
        ))}
      </GlassCard>
    </div>
  )
}
