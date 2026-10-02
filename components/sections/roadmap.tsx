"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { Calendar, Check, Circle, Flag, Loader2, RefreshCw, Target, XCircle } from "lucide-react"
import { GlassCard } from "@/components/dashboard/glass-card"
import { useStore } from "@/lib/store"

type RoadmapTask = { day: string; tasks: string[]; xp?: number }
type Week = { week: number; theme: string; weeklyGoal: string; dailyTasks: RoadmapTask[] }

export function RoadmapSection() {
  const { resumeText, jdText, targetRole, targetCompany, coachData, isGeneratingCoach, completedTaskIds, toggleTask } = useStore()
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const requestedKey = useRef<string | null>(null)
  const weeklyPlan: Week[] = Array.isArray(coachData?.weeklyPlan) ? coachData.weeklyPlan : []
  const allTasks = weeklyPlan.flatMap((week) => week.dailyTasks?.flatMap((day) => day.tasks.map((task) => ({ task, week: week.week, day: day.day }))) || [])
  const completed = allTasks.filter((item) => completedTaskIds.has(`roadmap-${item.week}-${item.day}-${item.task}`)).length
  const progress = allTasks.length ? Math.round(completed / allTasks.length * 100) : 0

  useEffect(() => {
    const requestKey = `${resumeText}\u0000${jdText}\u0000${targetRole}\u0000${targetCompany}\u0000${retry}`
    if (coachData || isGeneratingCoach || !resumeText.trim() || requestedKey.current === requestKey) return
    requestedKey.current = requestKey
    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 45000)
    let active = true

    async function generatePlan() {
      useStore.getState().setIsGeneratingCoach(true)
      setError(null)
      try {
        const response = await fetch("/api/agents/coach", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            resumeText, jdText, targetRole, targetCompany, weeksToGenerate: 4,
            studentContext: useStore.getState().getStudentContext(),
          }),
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || `Coach Agent request failed (${response.status})`)
        if (active) useStore.getState().setCoachData(data)
      } catch (requestError) {
        if (active) setError(requestError instanceof DOMException && requestError.name === "AbortError" ? "Roadmap generation timed out. Please try again." : requestError instanceof Error ? requestError.message : "Roadmap generation is unavailable.")
      } finally {
        window.clearTimeout(timeoutId)
        useStore.getState().setIsGeneratingCoach(false)
      }
    }
    void generatePlan()
    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timeoutId)
      requestedKey.current = null
      useStore.getState().setIsGeneratingCoach(false)
    }
  }, [coachData, jdText, resumeText, targetCompany, targetRole, retry])

  if (isGeneratingCoach) return <div className="flex h-[60vh] flex-col items-center justify-center text-muted-foreground"><Loader2 className="mb-4 size-8 animate-spin text-primary" /><p>Building your personalized roadmap...</p><p className="mt-2 text-xs">Your gaps and practice history are being prioritized.</p></div>
  if (error) return <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center text-muted-foreground"><XCircle className="size-10 text-destructive" /><p className="max-w-md text-sm">{error}</p><button onClick={() => { requestedKey.current = null; setError(null); setRetry((value) => value + 1) }} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:border-primary/50"><RefreshCw className="size-4" /> Try again</button></div>
  if (!coachData) return <div className="flex h-[60vh] flex-col items-center justify-center text-center text-muted-foreground"><Target className="mb-4 size-10 text-primary" /><p className="font-medium text-foreground">Your roadmap will appear after resume analysis</p><p className="mt-1 text-sm">Upload a resume from the Analyzer section to create a plan.</p></div>
  if (!weeklyPlan.length) return <div className="flex h-[60vh] flex-col items-center justify-center text-center text-muted-foreground"><p className="font-medium text-foreground">Roadmap data is incomplete</p><p className="mt-1 text-sm">Refresh the Coach Agent from the dashboard to generate a new plan.</p></div>

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Execution plan</p><h2 className="mt-1 text-2xl font-semibold">Your personalized roadmap</h2><p className="mt-1 text-sm text-muted-foreground">{coachData.motivationalNote || "A focused plan that turns your gaps into weekly progress."}</p></div><div className="min-w-44 rounded-xl border border-border bg-secondary/30 p-3"><div className="mb-2 flex justify-between text-xs"><span>Plan progress</span><span className="font-semibold text-primary">{progress}%</span></div><div className="h-2 overflow-hidden rounded-full bg-secondary"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div><p className="mt-1 text-[11px] text-muted-foreground">{completed} of {allTasks.length} tasks complete</p></div></div>
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">{weeklyPlan.map((week, index) => <motion.div key={week.week} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.07 }}><GlassCard className="h-full p-6"><div className="flex items-start justify-between gap-3"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-primary"><Calendar className="size-4" /> Week {week.week}</div><h3 className="text-lg font-semibold">{week.theme}</h3><p className="mt-1 text-sm text-muted-foreground">{week.weeklyGoal}</p></div><Flag className="size-5 text-primary" /></div><div className="mt-5 space-y-4">{week.dailyTasks?.map((day) => <div key={day.day}><p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{day.day}</p><div className="space-y-2">{day.tasks.map((task) => { const id = `roadmap-${week.week}-${day.day}-${task}`; const done = completedTaskIds.has(id); return <button key={id} onClick={() => toggleTask(id)} className="flex w-full items-start gap-3 rounded-lg border border-border/60 bg-secondary/20 p-3 text-left transition-colors hover:border-primary/50"><span className={`mt-0.5 ${done ? "text-primary" : "text-muted-foreground"}`}>{done ? <Check className="size-4" /> : <Circle className="size-4" />}</span><span className={`text-sm ${done ? "text-muted-foreground line-through" : "text-foreground"}`}>{task}</span></button> })}</div></div>)}</div></GlassCard></motion.div>)}</div>
  </div>
}
