"use client"

import { motion } from "framer-motion"
import { GlassCard } from "@/components/dashboard/glass-card"
import { AnimatedCounter } from "@/components/dashboard/animated-counter"
import { achievements } from "@/lib/mock-data"
import { Award, Flame, MapPin, Trophy, Lock, Mail, Github, Linkedin } from "lucide-react"

const stats = [
  { label: "Global Rank", value: 3, icon: Trophy },
  { label: "Day Streak", value: 32, icon: Flame },
  { label: "Total XP", value: 11760, icon: Award },
]

export function ProfileSection() {
  return (
    <div className="space-y-6">
      <GlassCard className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-[var(--chart-1)]/10" />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[var(--chart-1)] text-2xl font-bold text-primary-foreground">
            AR
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">Aditya Raj</h2>
            <p className="text-sm text-muted-foreground">Final Year · B.Tech CSE · Aspiring SDE</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Bengaluru, India
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> aditya@maps.ai
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="rounded-lg border border-border p-2 transition-colors hover:bg-secondary" aria-label="GitHub">
              <Github className="h-4 w-4" />
            </button>
            <button className="rounded-lg border border-border p-2 transition-colors hover:bg-secondary" aria-label="LinkedIn">
              <Linkedin className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-3 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card/50 p-4 text-center">
              <s.icon className="mx-auto mb-1.5 h-4 w-4 text-primary" />
              <p className="text-xl font-semibold tabular-nums">
                <AnimatedCounter value={s.value} />
              </p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Achievements</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {achievements.map((a, i) => (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -3 }}
              className={`rounded-xl border p-4 text-center ${
                a.unlocked ? "border-primary/30 bg-primary/5" : "border-border bg-secondary/30 opacity-60"
              }`}
            >
              <span
                className={`mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full ${
                  a.unlocked ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"
                }`}
              >
                {a.unlocked ? <Award className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
              </span>
              <p className="text-sm font-medium">{a.title}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{a.desc}</p>
            </motion.div>
          ))}
        </div>
      </GlassCard>
    </div>
  )
}
