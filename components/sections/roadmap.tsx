"use client"

import { motion } from "framer-motion"
import { GlassCard } from "@/components/dashboard/glass-card"
import { Check, MapPin, Loader2, Calendar } from "lucide-react"
import { useStore } from "@/lib/store"

export function RoadmapSection() {
  const { coachData, isGeneratingCoach } = useStore()
  
  const weeklyPlan = coachData?.weeklyPlan || []

  if (isGeneratingCoach) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-muted-foreground">
        <Loader2 className="mb-4 size-8 animate-spin text-primary" />
        <p>Coach Agent is generating your custom roadmap...</p>
      </div>
    )
  }

  if (!coachData) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center text-muted-foreground">
        <p>Please upload your resume in the Analyzer section</p>
        <p>to generate your personalized weekly roadmap.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Your Personalized AI Roadmap</h2>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Generated dynamically by the Coach Agent based on your specific resume gaps.
        </p>
      </GlassCard>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {weeklyPlan.map((week: any, i: number) => (
          <motion.div
            key={week.week}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
          >
            <GlassCard className="flex h-full flex-col p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Week {week.week}: {week.theme}</h3>
                  <p className="text-xs text-muted-foreground">Goal: {week.weeklyGoal}</p>
                </div>
                <div className="flex size-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                  <Calendar className="size-5" />
                </div>
              </div>
              <ul className="mt-4 space-y-4">
                {week.dailyTasks.map((day: any) => (
                  <li key={day.day} className="text-sm">
                    <span className="font-semibold text-primary">{day.day}:</span>
                    <ul className="mt-1 ml-4 space-y-1 border-l border-border/60 pl-3">
                      {day.tasks.map((task: string) => (
                        <li key={task} className="flex items-start gap-2">
                          <span className="mt-1 flex size-3 shrink-0 items-center justify-center rounded-full border border-border">
                            {/* Empty circle for pending tasks */}
                          </span>
                          <span className="text-muted-foreground">{task}</span>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
