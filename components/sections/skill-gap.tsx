"use client"

import { useEffect, useRef, useState } from "react"
import { motion } from "framer-motion"
import { ArrowUpRight, CheckCircle2, Loader2, RefreshCw, Target, XCircle } from "lucide-react"
import { GlassCard } from "@/components/dashboard/glass-card"
import { ReadinessRadar } from "@/components/dashboard/charts"
import { useStore } from "@/lib/store"

type SkillGap = {
  skill: string
  current: number
  required: number
  reason?: string
  action?: string
}

type Priority = { area: string; reason?: string; urgency?: string }

function normalizeGaps(value: unknown): SkillGap[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"))
    .map((item) => ({
      skill: String(item.skill ?? "Unnamed skill"),
      current: Math.max(0, Math.min(100, Number(item.current ?? item.currentLevel ?? 0))),
      required: Math.max(1, Math.min(100, Number(item.required ?? item.requiredLevel ?? 70))),
      reason: typeof item.reason === "string" ? item.reason : undefined,
      action: typeof item.action === "string" ? item.action : undefined,
    }))
    .filter((item) => item.skill !== "Unnamed skill")
}

export function SkillGapSection() {
  const {
    resumeText, jdText, targetRole, targetCompany, coachData, isGeneratingCoach,
    getLiveAtsScore, getLiveInterviewScore, getLiveAptitudeScore, getLiveCodingScore,
  } = useStore()
  const [error, setError] = useState<string | null>(null)
  const [retry, setRetry] = useState(0)
  const requestedKey = useRef<string | null>(null)
  const gaps = normalizeGaps(coachData?.skillGaps)
  const priorities: Priority[] = Array.isArray(coachData?.priorityAreas) ? coachData.priorityAreas : []

  useEffect(() => {
    const requestKey = `${resumeText}\u0000${jdText}\u0000${targetRole}\u0000${targetCompany}\u0000${retry}`
    if (coachData || isGeneratingCoach || !resumeText.trim() || requestedKey.current === requestKey) return
    requestedKey.current = requestKey

    const controller = new AbortController()
    const timeoutId = window.setTimeout(() => controller.abort(), 45000)
    let active = true

    async function generateReport() {
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
        if (!active) return
        setError(
          requestError instanceof DOMException && requestError.name === "AbortError"
            ? "Analysis timed out. Check your Groq connection and try again."
            : requestError instanceof Error ? requestError.message : "Skill Gap Analysis is unavailable.",
        )
      } finally {
        window.clearTimeout(timeoutId)
        useStore.getState().setIsGeneratingCoach(false)
      }
    }

    void generateReport()
    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timeoutId)
      requestedKey.current = null
      useStore.getState().setIsGeneratingCoach(false)
    }
  }, [coachData, jdText, resumeText, targetCompany, targetRole, retry])

  if (isGeneratingCoach) {
    return <div className="flex h-[60vh] flex-col items-center justify-center text-muted-foreground"><Loader2 className="mb-4 size-8 animate-spin text-primary" /><p>Comparing your resume, performance, and target role...</p><p className="mt-2 text-xs">This usually takes a few seconds.</p></div>
  }

  if (error) {
    return <div className="flex h-[60vh] flex-col items-center justify-center gap-4 text-center text-muted-foreground"><XCircle className="size-10 text-destructive" /><div><p className="font-medium text-foreground">Skill Gap Analysis unavailable</p><p className="mt-1 max-w-md text-sm">{error}</p></div><button onClick={() => { requestedKey.current = null; setRetry((value) => value + 1) }} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm text-foreground hover:border-primary/50"><RefreshCw className="size-4" /> Try again</button></div>
  }

  if (!resumeText.trim()) {
    return <div className="flex h-[60vh] flex-col items-center justify-center text-center text-muted-foreground"><Target className="mb-4 size-10 text-primary" /><p className="font-medium text-foreground">Upload your resume to unlock your skill profile</p><p className="mt-1 text-sm">Add a job description too for a role-specific comparison.</p></div>
  }

  if (!coachData) return null

  const radarData = [
    { dimension: "Resume", you: getLiveAtsScore(), cohort: 65 },
    { dimension: "Coding", you: getLiveCodingScore(), cohort: 60 },
    { dimension: "Interview", you: getLiveInterviewScore(), cohort: 55 },
    { dimension: "Aptitude", you: getLiveAptitudeScore(), cohort: 50 },
    { dimension: "Coverage", you: gaps.length ? Math.round(gaps.reduce((sum, gap) => sum + Math.min(100, gap.current / gap.required * 100), 0) / gaps.length) : 0, cohort: 60 },
  ]

  return <div className="space-y-6">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.2em] text-primary">Intelligence</p><h2 className="mt-1 text-2xl font-semibold">Your skill gap profile</h2><p className="mt-1 text-sm text-muted-foreground">Measured against {targetRole || "your target role"} at {targetCompany || "your target company"}.</p></div><div className="rounded-full border border-border bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground">{gaps.length} areas to improve</div></div>
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
      <GlassCard className="p-6 lg:col-span-3"><div className="mb-5 flex items-center justify-between"><div><h3 className="text-lg font-semibold">Capability baseline</h3><p className="text-sm text-muted-foreground">Current level versus the level your target role needs.</p></div><CheckCircle2 className="size-5 text-primary" /></div><div className="space-y-5">{gaps.length ? gaps.map((gap, index) => { const deficit = Math.max(0, gap.required - gap.current); return <motion.div key={`${gap.skill}-${index}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}><div className="mb-1.5 flex items-center justify-between gap-3 text-sm"><span className="font-medium">{gap.skill}</span><span className={deficit ? "text-chart-4" : "text-chart-2"}>{deficit ? `${deficit} points to close` : "On target"}</span></div><div className="relative h-3 overflow-hidden rounded-full bg-secondary"><div className="absolute inset-y-0 rounded-full bg-border" style={{ width: `${gap.required}%` }} /><motion.div className="absolute inset-y-0 rounded-full bg-primary" initial={{ width: 0 }} animate={{ width: `${gap.current}%` }} transition={{ duration: 0.8, delay: index * 0.05 }} /></div><div className="mt-1 flex justify-between text-[11px] text-muted-foreground"><span>Current {gap.current}%</span><span>Required {gap.required}%</span></div>{(gap.reason || gap.action) && <p className="mt-2 text-xs text-muted-foreground">{gap.action || gap.reason}</p>}</motion.div> }) : <p className="text-sm text-muted-foreground">No measurable gaps were returned. Refresh the analysis after adding a job description.</p>}</div></GlassCard>
      <GlassCard className="p-6 lg:col-span-2"><h3 className="mb-4 text-lg font-semibold">Readiness profile</h3><ReadinessRadar data={radarData} /></GlassCard>
    </div>
    <GlassCard className="p-6"><div className="mb-4 flex items-center justify-between"><div><h3 className="text-lg font-semibold">What to work on first</h3><p className="text-sm text-muted-foreground">Priorities are based on your largest deficits and observed performance.</p></div><ArrowUpRight className="size-5 text-primary" /></div><div className="grid grid-cols-1 gap-3 md:grid-cols-3">{priorities.slice(0, 3).map((priority, index) => <div key={`${priority.area}-${index}`} className="rounded-xl border border-border bg-secondary/30 p-4"><div className="flex items-center justify-between"><p className="font-medium">{priority.area}</p><span className="text-[10px] uppercase tracking-wider text-primary">{priority.urgency || "focus"}</span></div><p className="mt-2 text-sm text-muted-foreground">{priority.reason || "Build this capability through the roadmap tasks."}</p></div>)}</div></GlassCard>
  </div>
}
