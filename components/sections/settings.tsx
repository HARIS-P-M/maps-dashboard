"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { GlassCard } from "@/components/dashboard/glass-card"
import { useTheme } from "@/components/dashboard/theme-context"
import { Moon, Sun } from "lucide-react"

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
        checked ? "bg-primary" : "bg-secondary"
      }`}
    >
      <motion.span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-background shadow"
        animate={{ left: checked ? 22 : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  )
}

export function SettingsSection() {
  const { theme, toggle } = useTheme()
  const [prefs, setPrefs] = useState({
    dailyNudges: true,
    agentEmails: false,
    weeklyReport: true,
    soundEffects: true,
    publicLeaderboard: true,
  })

  const rows: { key: keyof typeof prefs; title: string; desc: string }[] = [
    { key: "dailyNudges", title: "Daily coach nudges", desc: "Get task reminders from the Coach Agent" },
    { key: "agentEmails", title: "Agent email digests", desc: "Weekly summary of agent activity" },
    { key: "weeklyReport", title: "Weekly progress report", desc: "Analytics delivered every Monday" },
    { key: "soundEffects", title: "Sound effects", desc: "Play sounds on achievements and streaks" },
    { key: "publicLeaderboard", title: "Show on leaderboard", desc: "Appear publicly in your cohort ranking" },
  ]

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <GlassCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Appearance</h2>
        <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/40 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/15 text-primary">
              {theme === "dark" ? <Moon className="h-4.5 w-4.5" /> : <Sun className="h-4.5 w-4.5" />}
            </span>
            <div>
              <p className="text-sm font-medium">Theme</p>
              <p className="text-xs text-muted-foreground capitalize">{theme} mode</p>
            </div>
          </div>
          <Toggle checked={theme === "dark"} onChange={toggle} label="Toggle dark mode" />
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Notifications & Privacy</h2>
        <div className="divide-y divide-border">
          {rows.map((r) => (
            <div key={r.key} className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-medium">{r.title}</p>
                <p className="text-xs text-muted-foreground">{r.desc}</p>
              </div>
              <Toggle
                checked={prefs[r.key]}
                onChange={(v) => setPrefs((p) => ({ ...p, [r.key]: v }))}
                label={r.title}
              />
            </div>
          ))}
        </div>
      </GlassCard>

      <GlassCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Target Configuration</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="text-sm">
            <span className="mb-1.5 block text-muted-foreground">Target role</span>
            <select className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary">
              <option>Software Engineer</option>
              <option>Data Analyst</option>
              <option>Frontend Engineer</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="mb-1.5 block text-muted-foreground">Weekly problem goal</span>
            <input
              type="number"
              defaultValue={15}
              className="w-full rounded-lg border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>
      </GlassCard>
    </div>
  )
}
