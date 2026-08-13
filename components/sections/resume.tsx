'use client'

import { useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, CheckCircle2, AlertTriangle, Sparkles,
  Loader2, ArrowRight, RotateCcw, ChevronDown, ChevronUp, UploadCloud
} from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/dashboard/glass-card'
import { RadialGauge } from '@/components/dashboard/radial-gauge'
import { useAgent } from '@/lib/agents/use-agent'
import { useStore } from '@/lib/store'

// ─── Types ────────────────────────────────────────────────────────────────────

type ATSFix = { issue: string; fix: string; priority: 'high' | 'medium' | 'low' }
type RewrittenBullet = { original: string; improved: string; reason: string }

type ResumeResult = {
  overallScore: number
  mode: 'resume-only' | 'jd-match'
  jdMatchScore: number | null
  sections: { summary: number; experience: number; skills: number; education: number }
  keywordGaps: string[]
  preferredMissing?: string[]
  criticalGaps?: string[]
  atsFixes: ATSFix[]
  rewrittenBullets: RewrittenBullet[]
  summary: string
}

const priorityColor = {
  high: 'text-destructive bg-destructive/10',
  medium: 'text-warning bg-warning/10',
  low: 'text-muted-foreground bg-secondary',
}

// ─── Dropzone Component ───────────────────────────────────────────────────────

const Dropzone = ({
  file,
  setFile,
  title,
  accept,
}: {
  file: File | null
  setFile: (f: File | null) => void
  title: string
  accept: string
}) => {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (files && files[0]) setFile(files[0])
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragging(true)
      }}
      onDragLeave={(e) => {
        e.preventDefault()
        setDragging(false)
      }}
      onDrop={(e) => {
        e.preventDefault()
        setDragging(false)
        handleFiles(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
      className={`grid cursor-pointer place-items-center rounded-xl border-2 border-dashed p-4 text-center transition-colors ${
        dragging
          ? 'border-primary bg-primary/10'
          : 'border-border bg-secondary/20 hover:border-primary/50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <motion.span
        animate={dragging ? { y: -4 } : { y: 0 }}
        className="mb-2 grid size-10 place-items-center rounded-lg bg-primary/15 text-primary"
      >
        {file ? <FileText className="size-5" /> : <UploadCloud className="size-5" />}
      </motion.span>
      {file ? (
        <p className="text-xs font-medium text-foreground">{file.name}</p>
      ) : (
        <p className="text-xs font-medium text-muted-foreground">{title}</p>
      )}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Resume() {
  const [targetRole, setTargetRole] = useState('Software Engineer (SDE-1)')
  const [targetCompany, setTargetCompany] = useState('')

  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [jdFile, setJdFile] = useState<File | null>(null)
  const [jdText, setJdText] = useState('')

  const [isParsing, setIsParsing] = useState(false)
  const [parseError, setParseError] = useState<string | null>(null)
  const [showBullets, setShowBullets] = useState(false)

  const store = useStore()
  const { call, data: result, isLoading, error: agentError, reset } = useAgent<ResumeResult>('resume')

  // When resume result arrives, save it to global store for cross-agent use
  const prevResultRef = useRef<ResumeResult | null>(null)
  useEffect(() => {
    if (result && result !== prevResultRef.current) {
      prevResultRef.current = result
      store.setResumeAnalysis({
        overallScore: result.overallScore,
        jdMatchScore: result.jdMatchScore,
        keywordGaps: result.keywordGaps,
        atsFixes: result.atsFixes,
        summary: result.summary,
        analyzedAt: new Date().toISOString(),
      })
      // Invalidate old coach plan so it regenerates with new resume data
      store.setCoachData(null)
    }
  }, [result, store])

  const isBusy = isParsing || isLoading
  const displayError = parseError || agentError

  const analyze = async () => {
    if (!resumeFile) return
    setIsParsing(true)
    setParseError(null)
    reset()

    try {
      // 1. Parse Resume
      const resumeFormData = new FormData()
      resumeFormData.append('file', resumeFile)
      const resumeRes = await fetch('/api/parse-document', { method: 'POST', body: resumeFormData })
      if (!resumeRes.ok) {
        const err = await resumeRes.json()
        throw new Error(`Resume Error: ${err.error || 'Failed to parse'}`)
      }
      const resumeData = await resumeRes.json()
      const parsedResumeText = resumeData.text

      // 2. Parse JD (if provided as file)
      let parsedJdText = jdText
      if (jdFile) {
        const jdFormData = new FormData()
        jdFormData.append('file', jdFile)
        const jdRes = await fetch('/api/parse-document', { method: 'POST', body: jdFormData })
        if (!jdRes.ok) {
          const err = await jdRes.json()
          throw new Error(`JD Error: ${err.error || 'Failed to parse'}`)
        }
        const jdData = await jdRes.json()
        parsedJdText = jdData.text
      }

      setIsParsing(false)

      // 3. Update global store for other agents (like Interview Agent)
      useStore.getState().setResumeText(parsedResumeText)
      useStore.getState().setJdText(parsedJdText)
      useStore.getState().setTargetRole(targetRole)

      // 4. Call AI agent
      await call({
        resumeText: parsedResumeText,
        targetRole,
        targetCompany,
        jdText: parsedJdText,
      })
    } catch (e: any) {
      setParseError(e.message)
      setIsParsing(false)
    }
  }

  const sectionLabels: Record<keyof ResumeResult['sections'], string> = {
    summary: 'Summary / Objective',
    experience: 'Work Experience',
    skills: 'Skills Section',
    education: 'Education',
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Left: Input + Results */}
      <div className="space-y-6 lg:col-span-2">
        {/* Input Panel */}
        <GlassCard className="p-6">
          <SectionHeading eyebrow="Resume Agent" title="Upload files for analysis" />
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Target Role
                </label>
                <input
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. SDE-1, Frontend Engineer"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  Target Company (optional)
                </label>
                <input
                  value={targetCompany}
                  onChange={(e) => setTargetCompany(e.target.value)}
                  className="w-full rounded-xl border border-border bg-secondary/40 px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary"
                  placeholder="e.g. Google, Amazon"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  1. Your Resume (Required)
                </label>
                <Dropzone
                  file={resumeFile}
                  setFile={setResumeFile}
                  title="Drop resume (.pdf, .docx)"
                  accept=".pdf,.doc,.docx,.txt"
                />
              </div>
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-muted-foreground">
                  2. Job Description (Optional)
                </label>
                {jdText.trim() === '' ? (
                  <Dropzone
                    file={jdFile}
                    setFile={setJdFile}
                    title="Drop JD (.pdf, .docx)"
                    accept=".pdf,.doc,.docx,.txt"
                  />
                ) : (
                  <div className="flex h-[88px] items-center justify-center rounded-xl border border-border bg-secondary/20 text-xs text-muted-foreground">
                    Using pasted JD text
                  </div>
                )}
              </div>
            </div>

            {/* Optional JD text fallback */}
            {!jdFile && (
              <div>
                <p className="mb-2 text-center text-[0.65rem] font-bold uppercase tracking-widest text-muted-foreground/60">
                  OR PASTE TEXT
                </p>
                <textarea
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                  placeholder="Paste Job Description text here..."
                  className="w-full resize-none rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm leading-relaxed outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
                  rows={2}
                />
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={analyze}
                disabled={!resumeFile || isBusy}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isBusy ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />{' '}
                    {isParsing ? 'Extracting text...' : 'Analyzing with AI...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" /> Analyze Resume
                  </>
                )}
              </button>
              {(result || parseError || agentError) && (
                <button
                  onClick={() => {
                    reset()
                    setParseError(null)
                    setResumeFile(null)
                    setJdFile(null)
                    setJdText('')
                  }}
                  className="flex items-center gap-1.5 rounded-xl border border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-secondary"
                >
                  <RotateCcw className="size-3.5" /> Reset
                </button>
              )}
            </div>

            {displayError && (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {displayError.includes('GROQ_API_KEY')
                  ? 'Add your GROQ_API_KEY to .env.local to enable the Resume Agent.'
                  : displayError}
              </p>
            )}
          </div>
        </GlassCard>

        {/* ATS Breakdown — shown after analysis */}
        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              
              {/* Critical Gaps for JD match */}
              {result.mode === 'jd-match' && result.criticalGaps && result.criticalGaps.length > 0 && (
                <GlassCard className="border-destructive/20 bg-destructive/5 p-6">
                  <SectionHeading eyebrow="Critical Gaps" title="Must-Have Missing Tech" />
                  <ul className="mt-4 space-y-3">
                    {result.criticalGaps.map((gap, i) => (
                      <li key={i} className="flex gap-2 text-sm text-destructive/90">
                        <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                        {gap}
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              )}

              {/* Section scores */}
              <GlassCard className="p-6">
                <SectionHeading eyebrow="ATS Breakdown" title="Score by category" />
                <div className="mt-4 space-y-4">
                  {(Object.keys(result.sections) as Array<keyof typeof result.sections>).map((key) => {
                    const score = result.sections[key] * 10
                    return (
                      <div key={key}>
                        <div className="mb-1.5 flex justify-between text-sm">
                          <span>{sectionLabels[key]}</span>
                          <span className="font-mono text-muted-foreground">{result.sections[key]}/10</span>
                        </div>
                        <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                          <motion.div
                            className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                            initial={{ width: 0 }}
                            animate={{ width: `${score}%` }}
                            transition={{ duration: 1.1, ease: 'easeOut' }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </GlassCard>

              {/* ATS Fixes */}
              {result.atsFixes && result.atsFixes.length > 0 && (
                <GlassCard className="p-6">
                  <SectionHeading eyebrow="Action Items" title="ATS fixes to apply" />
                  <ul className="mt-4 space-y-3">
                    {result.atsFixes.map((fix, i) => (
                      <li key={i} className="rounded-xl border border-border/60 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-start gap-2.5">
                            <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                            <div>
                              <p className="text-sm font-medium">{fix.issue}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground">{fix.fix}</p>
                            </div>
                          </div>
                          <span
                            className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold capitalize ${
                              priorityColor[fix.priority]
                            }`}
                          >
                            {fix.priority}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </GlassCard>
              )}

              {/* Rewritten bullets */}
              {result.rewrittenBullets?.length > 0 && (
                <GlassCard className="p-6">
                  <button
                    onClick={() => setShowBullets((s) => !s)}
                    className="flex w-full items-center justify-between text-left"
                  >
                    <SectionHeading eyebrow="AI Rewrites" title="Improved bullet points" />
                    {showBullets ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </button>
                  <AnimatePresence>
                    {showBullets && (
                      <motion.ul
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 space-y-4 overflow-hidden"
                      >
                        {result.rewrittenBullets.map((b, i) => (
                          <li key={i} className="space-y-2 rounded-xl border border-border/60 p-3">
                            <p className="flex items-start gap-2 text-xs text-destructive line-through opacity-70">
                              <span className="mt-0.5 shrink-0 font-semibold not-italic">Before:</span>
                              {b.original}
                            </p>
                            <p className="flex items-start gap-2 text-xs text-success">
                              <ArrowRight className="mt-0.5 size-3 shrink-0" />
                              {b.improved}
                            </p>
                            {b.reason && (
                              <p className="ml-5 text-[10px] text-muted-foreground">
                                <span className="font-semibold uppercase tracking-wider">Why:</span> {b.reason}
                              </p>
                            )}
                          </li>
                        ))}
                      </motion.ul>
                    )}
                  </AnimatePresence>
                </GlassCard>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Scores + Keywords */}
      <div className="space-y-6">
        {result ? (
          <>
            <GlassCard glow className="flex flex-col items-center p-6 text-center">
              <p className="mb-4 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                ATS Score
              </p>
              <RadialGauge
                value={result.overallScore}
                suffix=""
                label="out of 100"
                color="var(--chart-2)"
              />
              <p className="mt-4 text-sm text-muted-foreground">{result.summary}</p>
            </GlassCard>

            {result.mode === 'jd-match' && result.jdMatchScore !== null && (
              <GlassCard className="flex flex-col items-center p-6 text-center">
                <p className="mb-4 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
                  JD Match Score
                </p>
                <RadialGauge
                  value={result.jdMatchScore}
                  suffix="%"
                  label="match rate"
                  color="var(--chart-3)"
                />
              </GlassCard>
            )}

            {result.keywordGaps && result.keywordGaps.length > 0 && (
              <GlassCard className="p-6">
                <SectionHeading eyebrow="Missing Keywords" title="Add these terms" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.keywordGaps.map((kw, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-warning/30 bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}

            {result.preferredMissing && result.preferredMissing.length > 0 && (
              <GlassCard className="p-6">
                <SectionHeading eyebrow="Preferred / Bonus" title="Nice-to-have missing" />
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.preferredMissing.map((kw, i) => (
                    <span
                      key={i}
                      className="rounded-full border border-muted-foreground/30 bg-secondary px-2.5 py-1 text-xs font-medium text-muted-foreground"
                    >
                      + {kw}
                    </span>
                  ))}
                </div>
              </GlassCard>
            )}
          </>
        ) : (
          <GlassCard className="p-6">
            <SectionHeading eyebrow="Agent suggestions" title="How it works" />
            <ul className="mt-3 space-y-3">
              {[
                { icon: UploadCloud, text: 'Upload your resume (.pdf, .docx)', color: 'text-primary' },
                { icon: CheckCircle2, text: 'Set your target role and company', color: 'text-success' },
                { icon: FileText, text: 'Optionally upload a Job Description to get Match Score', color: 'text-warning' },
                { icon: Sparkles, text: 'Click Analyze — Groq AI reviews it instantly', color: 'text-primary' },
                {
                  icon: ArrowRight,
                  text: 'Get ATS score, missing tech, and AI bullet rewrites',
                  color: 'text-muted-foreground',
                },
              ].map(({ icon: Icon, text, color }, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <Icon className={`mt-0.5 size-4 shrink-0 ${color}`} />
                  <span className="leading-snug">{text}</span>
                </li>
              ))}
            </ul>
          </GlassCard>
        )}
      </div>
    </div>
  )
}
