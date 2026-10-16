"use client"

import { useEffect, useState } from "react"
import { GlassCard } from "@/components/dashboard/glass-card"

type LeaderboardEntry = {
  id: string
  name: string
  xp: number
  streak: number
  rank: number
  delta: number
}

export function LeaderboardSection() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    void fetch("/api/leaderboard", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || "Unable to load the leaderboard.")
        setEntries(data.leaderboard)
      })
      .catch((requestError) => {
        setError(requestError instanceof Error ? requestError.message : "Unable to load the leaderboard.")
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <GlassCard className="p-10 text-center text-sm text-muted-foreground">Loading cohort rankings...</GlassCard>
  }

  if (error) {
    return <GlassCard className="border-destructive/30 p-10 text-center text-sm text-destructive">{error}</GlassCard>
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <h2 className="mb-6 text-lg font-semibold">Cohort Leaderboard</h2>
        {entries.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">No active students are available.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div key={entry.id} className="grid grid-cols-[3rem_1fr_auto_auto] items-center gap-4 rounded-xl border border-border/60 bg-secondary/20 px-4 py-3">
                <span className="font-semibold text-muted-foreground">#{entry.rank}</span>
                <span className="font-medium">{entry.name}</span>
                <span className="text-right text-sm tabular-nums">{entry.xp.toLocaleString()} XP</span>
                <span className="text-right text-sm text-muted-foreground tabular-nums">{entry.streak} day streak</span>
              </div>
            ))}
          </div>
        )}
      </GlassCard>
    </div>
  )
}
