"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  Building2, Target, TrendingUp, CheckCircle2, Circle, Clock,
  Loader2, ChevronDown, Lightbulb, AlertTriangle, Zap
} from "lucide-react"
import { GlassCard, SectionHeading } from "@/components/dashboard/glass-card"
import { useStore } from "@/lib/store"

// ─── Company List ─────────────────────────────────────────────────────────────

const COMPANY_OPTIONS = [
  { name: 'Kaar Technologies (GE 27 Batch)', accent: '#6366f1', difficulty: 'Medium' },
  { name: 'TCS NQT', accent: '#0ea5e9', difficulty: 'Easy' },
  { name: 'Infosys', accent: '#f59e0b', difficulty: 'Easy' },
  { name: 'Wipro', accent: '#22c55e', difficulty: 'Easy' },
  { name: 'Cognizant', accent: '#8b5cf6', difficulty: 'Medium' },
  { name: 'Zoho', accent: '#ec4899', difficulty: 'Medium' },
  { name: 'Amazon', accent: '#f97316', difficulty: 'Hard' },
  { name: 'Google', accent: '#14b8a6', difficulty: 'Hard' },
  { name: 'Microsoft', accent: '#3b82f6', difficulty: 'Hard' },
]

const ROLES = [
  'Software Engineer (SDE-1)',
  'Software Engineer (SDE-2)',
  'Frontend Engineer',
  'Backend Engineer',
  'Full Stack Engineer',
  'ML Engineer',
  'Data Engineer',
]

function DifficultyBadge({ level }: { level: string }) {
  const map: Record<string, string> = {
    Hard: 'bg-rose-500/15 text-rose-400',
    Medium: 'bg-amber-500/15 text-amber-400',
    Easy: 'bg-emerald-500/15 text-emerald-400',
  }
  return (
    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${map[level] ?? map.Medium}`}>
      {level}
    </span>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CompanySection() {
  const { resumeText, getStudentContext, targetCompany, setTargetCompany } = useStore()

  const [selectedCompany, setSelectedCompany] = useState(COMPANY_OPTIONS[0].name)
  const [selectedRole, setSelectedRole] = useState(ROLES[0])
  const [analysis, setAnalysis] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const analyze = async () => {
    setLoading(true)
    setError(null)
    setAnalysis(null)
    // Update global target company in store so other agents know
    setTargetCompany(selectedCompany)
    try {
      const res = await fetch('/api/agents/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName: selectedCompany,
          role: selectedRole,
          resumeText: resumeText.slice(0, 3000),
          studentContext: getStudentContext(),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Company Agent failed')
      setAnalysis(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">

      {/* Company Selector Row */}
      <GlassCard className="p-6">
        <SectionHeading eyebrow="Company Agent" title="Analyze your match for a target company" />
        <div className="mt-5 flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Target Company</label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            >
              {COMPANY_OPTIONS.map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Target Role</label>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2.5 text-sm outline-none focus:ring-1 focus:ring-primary"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
          <button
            onClick={analyze}
            disabled={loading}
            className="flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground transition hover:brightness-110 disabled:opacity-60"
          >
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Zap className="size-4" />}
            {loading ? 'Analyzing…' : 'Analyze My Match'}
          </button>
        </div>
        {!resumeText && (
          <p className="mt-3 text-xs text-amber-400 flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" />
            Upload your resume in the Analyzer tab for a personalized match score.
          </p>
        )}
        {error && <p className="mt-3 text-xs text-destructive">{error}</p>}
      </GlassCard>

      {/* Company Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {COMPANY_OPTIONS.map((c, i) => (
          <motion.button
            key={c.name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => { setSelectedCompany(c.name); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            className={`text-left rounded-2xl border p-5 transition-all ${
              selectedCompany === c.name
                ? 'border-primary/50 bg-primary/5'
                : 'border-border bg-secondary/20 hover:border-border/80'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{ backgroundColor: `color-mix(in oklch, ${c.accent} 18%, transparent)` }}
              >
                <Building2 className="h-5 w-5" style={{ color: c.accent }} />
              </div>
              <DifficultyBadge level={c.difficulty} />
            </div>
            <h3 className="mt-3 text-base font-semibold leading-tight">{c.name}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {selectedCompany === c.name ? '← Currently selected' : 'Click to analyze'}
            </p>
          </motion.button>
        ))}
      </div>

      {/* AI Analysis Result */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {/* Match Score */}
            <GlassCard className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Profile match for</p>
                  <h3 className="text-lg font-semibold">{analysis.company} — {analysis.role}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-4xl font-bold text-primary">{analysis.matchScore}%</p>
                    <p className="text-xs text-muted-foreground">Match Score</p>
                  </div>
                </div>
              </div>
              <div className="mt-4 h-3 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${analysis.matchScore}%` }}
                  transition={{ duration: 1.2 }}
                />
              </div>
            </GlassCard>

            {/* Interview Process */}
            {analysis.interviewProcess?.length > 0 && (
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold">Interview Process</h2>
                </div>
                <div className="relative pl-6">
                  <div className="absolute left-[9px] top-2 bottom-2 w-px bg-border" aria-hidden />
                  <ol className="space-y-5">
                    {analysis.interviewProcess.map((round: any, i: number) => (
                      <motion.li
                        key={i}
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="relative"
                      >
                        <span className="absolute -left-6 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-card text-primary">
                          <Circle className="h-3 w-3 fill-primary" />
                        </span>
                        <div>
                          <h3 className="font-medium text-sm">{round.round} — <span className="text-muted-foreground font-normal">{round.format}</span></h3>
                          <p className="mt-0.5 text-xs text-muted-foreground">{round.tips}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ol>
                </div>
              </GlassCard>
            )}

            {/* Skill Gaps */}
            {analysis.skillGaps?.length > 0 && (
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-400" />
                  <h2 className="text-base font-semibold">Your Skill Gaps for {analysis.company}</h2>
                </div>
                <div className="space-y-3">
                  {analysis.skillGaps.map((gap: any, i: number) => (
                    <div key={i} className="flex items-center justify-between rounded-xl border border-border/60 bg-secondary/30 px-4 py-3 text-sm">
                      <span className="font-medium">{gap.skill}</span>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-muted-foreground">Current: <span className="text-foreground">{gap.currentLevel}</span></span>
                        <span className="text-primary">→</span>
                        <span className="text-muted-foreground">Required: <span className="text-foreground">{gap.requiredLevel}</span></span>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Prep Timeline */}
            {analysis.prepTimeline?.length > 0 && (
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  <h2 className="text-base font-semibold">2-Week Prep Timeline</h2>
                </div>
                <div className="space-y-4">
                  {analysis.prepTimeline.map((week: any, i: number) => (
                    <div key={i} className="rounded-xl border border-border/60 bg-secondary/20 p-4">
                      <h3 className="mb-2 text-sm font-semibold text-primary">{week.week}: {week.focus}</h3>
                      <ul className="space-y-1.5">
                        {week.tasks?.map((task: string, j: number) => (
                          <li key={j} className="flex items-start gap-2 text-xs text-muted-foreground">
                            <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-primary/60" />
                            {task}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Insider Tips */}
            {analysis.insiderTips?.length > 0 && (
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-amber-400" />
                  <h2 className="text-base font-semibold">Insider Tips for {analysis.company}</h2>
                </div>
                <ul className="space-y-2">
                  {analysis.insiderTips.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="mt-1 size-1.5 shrink-0 rounded-full bg-amber-400" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </GlassCard>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading State */}
      {loading && (
        <GlassCard className="p-10 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm">Company Agent is analyzing your profile against {selectedCompany}…</p>
        </GlassCard>
      )}
    </div>
  )
}
