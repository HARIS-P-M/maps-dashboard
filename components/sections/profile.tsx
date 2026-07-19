"use client"

import { motion } from "framer-motion"
import { GlassCard } from "@/components/dashboard/glass-card"
import { AnimatedCounter } from "@/components/dashboard/animated-counter"
import { achievements } from "@/lib/mock-data"
import { Award, Flame, MapPin, Trophy, Lock, Mail } from "lucide-react"
import { useAuth } from "@/components/dashboard/auth-context"

function Github(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
      <path d="M9 18c-4.51 2-5-2-7-2" />
    </svg>
  )
}

function Linkedin(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  )
}

export function ProfileSection() {
  const { user } = useAuth()

  const dynamicStats = [
    { label: "Global Rank", value: 3, icon: Trophy },
    { label: "Day Streak", value: user?.stats.streak ?? 32, icon: Flame },
    { label: "Total XP", value: (user?.stats.problemsSolved ?? 74) * 150 + 660, icon: Award },
  ]

  const userEmail = user
    ? `${user.username.toLowerCase().replace(/\s+/g, "")}@maps.ai`
    : "aditya@maps.ai"

  return (
    <div className="space-y-6">
      <GlassCard className="relative overflow-hidden p-6">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/15 via-transparent to-[var(--chart-1)]/10" />
        <div className="relative flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-[var(--chart-1)] text-2xl font-bold text-primary-foreground">
            {user ? user.username.substring(0, 2).toUpperCase() : "US"}
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-semibold">{user ? user.username : "Aditya Raj"}</h2>
            <p className="text-sm text-muted-foreground">
              {user?.role === "admin" ? "Platform Administrator" : "Final Year · B.Tech CSE · Aspiring SDE"}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5" /> Bengaluru, India
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-3.5 w-3.5" /> {userEmail}
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
          {dynamicStats.map((s) => (
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
