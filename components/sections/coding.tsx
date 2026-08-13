'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Play, Lightbulb,
  TerminalSquare, Loader2, ChevronRight,
  Sparkles, Code2, Zap, RefreshCw,
  Building2, Tag, BarChart3, ChevronDown, ChevronUp, Check,
} from 'lucide-react'
import { GlassCard } from '@/components/dashboard/glass-card'
import { CodeEditor } from '@/components/dashboard/code-editor'
import { useAgent } from '@/lib/agents/use-agent'
import { useStore } from '@/lib/store'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

// ─── Types ────────────────────────────────────────────────────────────────────

type SampleCase = { input: string; expected_output: string; explanation: string }
type Judge0Case = { input: string; output: string }

type GeneratedProblem = {
  title: string
  problem_statement: string
  constraints: string
  input_format: string
  output_format: string
  topic: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  sample_cases: SampleCase[]
  judge0_test_cases: Judge0Case[]
  optimal_solution_python: string
}

type HintResult = { hint: string; hintLevel: number; action: string }
type TestCaseResult = { test: number; passed: boolean; output?: string }
type ExecuteResult = {
  action: string
  passed: boolean
  stdout: string
  timeComplexity: string
  spaceComplexity: string
  feedback: string
  testResults?: TestCaseResult[]
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPANIES = [
  'Kaar Technologies (GE 27 Batch)',
  'TCS NQT',
  'Infosys',
  'Wipro',
  'Cognizant',
  'Zoho',
  'HCL Technologies',
  'Capgemini',
  'Amazon',
  'Google',
  'Microsoft',
  'Flipkart',
]

const TOPICS = [
  'Arrays',
  'Strings',
  'Linked Lists',
  'Stacks & Queues',
  'Trees & Binary Trees',
  'Graphs',
  'Dynamic Programming',
  'Recursion & Backtracking',
  'Sorting & Searching',
  'Hashing',
  'Greedy Algorithms',
  'Bit Manipulation',
  'Two Pointers',
  'Sliding Window',
  'Heaps & Priority Queues',
]

const DIFFICULTIES = ['Easy', 'Medium', 'Hard'] as const

const diffBg: Record<string, string> = {
  Easy: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  Hard: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
}

const diffActive: Record<string, string> = {
  Easy: 'bg-emerald-500/25 text-emerald-300 border-emerald-400/50 shadow-[0_0_12px_rgba(52,211,153,0.25)]',
  Medium: 'bg-amber-500/25 text-amber-300 border-amber-400/50 shadow-[0_0_12px_rgba(251,191,36,0.25)]',
  Hard: 'bg-rose-500/25 text-rose-300 border-rose-400/50 shadow-[0_0_12px_rgba(251,113,133,0.25)]',
}

const STARTER_CODE = `def solve():
    # Read input
    # n = int(input())
    
    # Write your solution here
    pass

solve()`

// ─── Custom Dropdown (Portal-based to escape overflow:hidden) ─────────────────

function CustomDropdown({
  icon: Icon,
  label,
  value,
  options,
  onChange,
}: {
  icon: React.ElementType
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({})
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return
    const rect = triggerRef.current.getBoundingClientRect()
    setMenuStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 240),
      zIndex: 9999,
    })
  }, [])

  useEffect(() => {
    if (open) updatePosition()
  }, [open, updatePosition])

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        menuRef.current && !menuRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }
    const handleScroll = () => { if (open) updatePosition() }
    document.addEventListener('mousedown', handleOutside)
    window.addEventListener('scroll', handleScroll, true)
    return () => {
      document.removeEventListener('mousedown', handleOutside)
      window.removeEventListener('scroll', handleScroll, true)
    }
  }, [open, updatePosition])

  const menu = open ? (
    <div
      ref={menuRef}
      style={menuStyle}
      className="overflow-hidden rounded-xl border border-border/70 bg-[#1a1d27] shadow-2xl shadow-black/70 backdrop-blur-xl"
    >
      <div className="px-2 pt-2 pb-1">
        <p className="px-2 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
      </div>
      <div className="max-h-64 overflow-y-auto px-2 pb-2">
        {options.map((opt) => (
          <button
            key={opt}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => { onChange(opt); setOpen(false) }}
            className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all text-left ${
              value === opt
                ? 'bg-primary/15 text-primary'
                : 'text-foreground/80 hover:bg-white/5 hover:text-foreground'
            }`}
          >
            {value === opt
              ? <Check className="size-3 shrink-0 text-primary" />
              : <span className="size-3 shrink-0" />}
            <span className="truncate">{opt}</span>
          </button>
        ))}
      </div>
    </div>
  ) : null

  return (
    <div className="relative flex-1 min-w-[160px]">
      <button
        ref={triggerRef}
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-sm text-foreground transition-all ${
          open
            ? 'border-primary/50 bg-secondary/60'
            : 'border-border/60 bg-secondary/30 hover:border-primary/40 hover:bg-secondary/50'
        }`}
      >
        <Icon className="size-3.5 shrink-0 text-primary" />
        <span className="flex-1 truncate text-left font-medium">{value}</span>
        <ChevronDown className={`size-3.5 shrink-0 text-muted-foreground transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {typeof window !== 'undefined' && createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="dropdown"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={menuStyle}
              className="overflow-hidden rounded-xl border border-border/70 bg-[#1a1d27] shadow-2xl shadow-black/70 backdrop-blur-xl"
            >
              <div className="px-2 pt-2 pb-1">
                <p className="px-2 py-1 text-[0.6rem] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
              </div>
              <div className="max-h-64 overflow-y-auto px-2 pb-2" ref={menuRef}>
                {options.map((opt) => (
                  <button
                    key={opt}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => { onChange(opt); setOpen(false) }}
                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-all text-left ${
                      value === opt
                        ? 'bg-primary/15 text-primary'
                        : 'text-foreground/80 hover:bg-white/5 hover:text-foreground'
                    }`}
                  >
                    {value === opt
                      ? <Check className="size-3 shrink-0 text-primary" />
                      : <span className="size-3 shrink-0" />}
                    <span className="truncate">{opt}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function Coding() {
  const { addCodingSession } = useStore()
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0])
  const [selectedTopic, setSelectedTopic] = useState(TOPICS[0])
  const [selectedDifficulty, setSelectedDifficulty] = useState<typeof DIFFICULTIES[number]>('Medium')

  const [problem, setProblem] = useState<GeneratedProblem | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  const [code, setCode] = useState(STARTER_CODE)
  const [executing, setExecuting] = useState(false)
  const [execResult, setExecResult] = useState<ExecuteResult | null>(null)
  const [execError, setExecError] = useState<string | null>(null)

  const [hintLevel, setHintLevel] = useState(1)
  const [expandedSample, setExpandedSample] = useState(0)
  const [showConstraints, setShowConstraints] = useState(false)
  const [activeTab, setActiveTab] = useState<'problem' | 'solution'>('problem')

  const {
    call: callHint,
    data: hintResult,
    isLoading: hintLoading,
    error: hintError,
    reset: resetHint,
  } = useAgent<HintResult>('coding')

  const generateProblem = async () => {
    setGenerating(true)
    setGenError(null)
    setProblem(null)
    setExecResult(null)
    setCode(STARTER_CODE)
    resetHint()
    setHintLevel(1)
    setActiveTab('problem')
    try {
      const res = await fetch('/api/agents/generate-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company: selectedCompany, topic: selectedTopic, difficulty: selectedDifficulty }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate problem')
      setProblem(data)
    } catch (err: any) {
      setGenError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const runCode = async () => {
    if (!problem) return
    setExecuting(true)
    setExecResult(null)
    setExecError(null)
    try {
      const res = await fetch('/api/agents/coding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemStatement: problem.problem_statement,
          userCode: code,
          language: 'python',
          action: 'execute',
          judge0TestCases: problem.judge0_test_cases,
          optimalSolutionPython: problem.optimal_solution_python,
        }),
      })
      const data: ExecuteResult = await res.json()
      if (!res.ok) throw new Error((data as any).error)
      setExecResult(data)

      // ── Save to global store for cross-agent intelligence ─────────────────
      addCodingSession({
        problemTitle: problem.title,
        topic: problem.topic || selectedTopic,
        difficulty: problem.difficulty || selectedDifficulty,
        passed: data.passed,
        company: selectedCompany,
        solvedAt: new Date().toISOString(),
      })
    } catch (err: any) {
      setExecError(err.message)
    } finally {
      setExecuting(false)
    }
  }

  const getHint = async () => {
    if (!problem) return
    await callHint({
      problemStatement: problem.problem_statement,
      userCode: code,
      language: 'python',
      hintLevel,
      action: 'hint',
    })
    setHintLevel((l) => Math.min(l + 1, 3))
  }

  const hintLevelLabel = ['', 'Conceptual', 'Approach', 'Implementation'][hintLevel] ?? 'Implementation'
  const passedCount = execResult?.testResults?.filter((t) => t.passed).length
    ?? (execResult?.passed ? problem?.judge0_test_cases?.length ?? 1 : 0)
  const totalTests = problem?.judge0_test_cases?.length ?? 3

  return (
    <div className="space-y-5">

      {/* ── Controls Bar ─────────────────────────────────────────────────── */}
      <GlassCard className="p-4">
        <div className="flex flex-wrap items-center gap-3">

          {/* Company Dropdown */}
          <CustomDropdown
            icon={Building2}
            label="Target Company"
            value={selectedCompany}
            options={COMPANIES}
            onChange={setSelectedCompany}
          />

          {/* Topic Dropdown */}
          <CustomDropdown
            icon={Tag}
            label="DSA Topic"
            value={selectedTopic}
            options={TOPICS}
            onChange={setSelectedTopic}
          />

          {/* Difficulty Pills */}
          <div className="flex items-center gap-1.5 rounded-xl border border-border/50 bg-secondary/20 p-1">
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                onClick={() => setSelectedDifficulty(d)}
                className={`rounded-lg border px-3.5 py-1.5 text-xs font-bold tracking-wide transition-all duration-200 ${
                  selectedDifficulty === d ? diffActive[d] : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Generate Button */}
          <button
            onClick={generateProblem}
            disabled={generating}
            className="group relative ml-auto flex items-center gap-2 overflow-hidden rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:shadow-primary/40 hover:brightness-110 disabled:opacity-60"
          >
            <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-500 group-hover:translate-x-full" />
            {generating ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {generating ? 'Generating…' : problem ? 'New Problem' : 'Generate Problem'}
          </button>
        </div>
      </GlassCard>

      {/* ── Error ──────────────────────────────────────────────────────────── */}
      {genError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          ⚠ {genError}
        </div>
      )}

      {/* ── Empty State ────────────────────────────────────────────────────── */}
      {!problem && !generating && !genError && (
        <GlassCard className="p-20 text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', bounce: 0.4 }}
            className="mx-auto mb-5 flex size-20 items-center justify-center rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 ring-1 ring-primary/20"
          >
            <Code2 className="size-9 text-primary" />
          </motion.div>
          <h3 className="mb-2 text-xl font-bold">AI Coding Arena</h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground leading-relaxed">
            Choose your <span className="text-foreground font-medium">target company</span>, a{' '}
            <span className="text-foreground font-medium">DSA topic</span>, and a{' '}
            <span className="text-foreground font-medium">difficulty level</span>, then hit{' '}
            <span className="text-primary font-semibold">Generate Problem</span> to get a tailored challenge.
          </p>
        </GlassCard>
      )}

      {/* ── Loading State ──────────────────────────────────────────────────── */}
      {generating && (
        <GlassCard className="p-20 text-center">
          <div className="relative mx-auto mb-5 flex size-16 items-center justify-center">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <Loader2 className="relative size-8 animate-spin text-primary" />
          </div>
          <p className="text-sm text-muted-foreground">
            Crafting a{' '}
            <span className={`font-bold ${diffBg[selectedDifficulty].split(' ')[1]}`}>{selectedDifficulty}</span>{' '}
            <span className="text-foreground font-semibold">{selectedTopic}</span> problem for{' '}
            <span className="text-primary font-semibold">{selectedCompany}</span>…
          </p>
        </GlassCard>
      )}

      {/* ── Main Arena ─────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {problem && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="grid grid-cols-1 gap-5 lg:grid-cols-5"
          >
            {/* ── LEFT: Problem Panel ──────────────────────────────── */}
            <div className="space-y-4 lg:col-span-2">
              <GlassCard className="overflow-hidden p-0">
                {/* Problem header band */}
                <div className="border-b border-border/50 bg-secondary/20 px-5 pt-5 pb-4">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full border px-2.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wide ${diffBg[problem.difficulty]}`}>
                      {problem.difficulty}
                    </span>
                    <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[0.65rem] font-medium text-primary">
                      {problem.topic}
                    </span>
                  </div>
                  <h2 className="text-base font-bold leading-snug">{problem.title}</h2>
                  <p className="mt-1 text-[0.7rem] text-muted-foreground flex items-center gap-1">
                    <Building2 className="size-3" />{selectedCompany}
                  </p>
                </div>

                {/* Tab bar */}
                <div className="flex border-b border-border/50">
                  {(['problem', 'solution'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex-1 py-2.5 text-xs font-semibold transition-all relative ${
                        activeTab === tab ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {tab === 'problem' ? 'Problem' : 'Reference Solution'}
                      {activeTab === tab && (
                        <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 h-0.5 w-full bg-primary" />
                      )}
                    </button>
                  ))}
                </div>

                <div className="max-h-[520px] overflow-y-auto p-5">
                  {activeTab === 'problem' ? (
                    <div className="space-y-4">
                      {/* Statement */}
                      <div className="prose prose-invert prose-sm prose-p:leading-relaxed max-w-none text-sm text-foreground/90">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{problem.problem_statement}</ReactMarkdown>
                      </div>

                      {/* Constraints */}
                      <div className="overflow-hidden rounded-xl border border-border/50">
                        <button
                          onClick={() => setShowConstraints(!showConstraints)}
                          className="flex w-full items-center justify-between bg-secondary/20 px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <span className="flex items-center gap-1.5"><BarChart3 className="size-3.5 text-primary" /> Constraints</span>
                          {showConstraints ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                        </button>
                        <AnimatePresence>
                          {showConstraints && (
                            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                              <pre className="whitespace-pre-wrap p-3 font-mono text-xs text-muted-foreground leading-relaxed">
                                {problem.constraints}
                              </pre>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* I/O Format */}
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { label: 'Input Format', content: problem.input_format },
                          { label: 'Output Format', content: problem.output_format },
                        ].map(({ label, content }) => (
                          <div key={label} className="rounded-xl border border-border/50 bg-secondary/10 p-3">
                            <p className="mb-1.5 text-[0.65rem] font-bold uppercase tracking-wide text-primary">{label}</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">{content}</p>
                          </div>
                        ))}
                      </div>

                      {/* Sample Cases */}
                      {problem.sample_cases?.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-[0.65rem] font-bold uppercase tracking-wide text-muted-foreground">Sample Cases</p>
                          {problem.sample_cases.map((sc, i) => (
                            <div key={i} className="overflow-hidden rounded-xl border border-border/50">
                              <button
                                onClick={() => setExpandedSample(expandedSample === i ? -1 : i)}
                                className="flex w-full items-center justify-between bg-secondary/20 px-3 py-2 text-xs font-medium hover:bg-secondary/40 transition-colors"
                              >
                                <span className="flex items-center gap-1.5">
                                  <span className="flex size-4 items-center justify-center rounded bg-primary/15 text-[0.6rem] font-bold text-primary">{i + 1}</span>
                                  Example {i + 1}
                                </span>
                                {expandedSample === i ? <ChevronUp className="size-3.5" /> : <ChevronDown className="size-3.5" />}
                              </button>
                              <AnimatePresence>
                                {expandedSample === i && (
                                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
                                    <div className="border-t border-border/50 p-3 space-y-2.5">
                                      {[
                                        { label: 'Input', content: sc.input, mono: true },
                                        { label: 'Expected Output', content: sc.expected_output, mono: true },
                                        { label: 'Explanation', content: sc.explanation, mono: false },
                                      ].map(({ label, content, mono }) => (
                                        <div key={label}>
                                          <p className="mb-1 text-[0.6rem] font-bold uppercase tracking-wide text-muted-foreground/70">{label}</p>
                                          {mono
                                            ? <pre className="rounded-lg bg-[#1a1d23] p-2 text-xs font-mono text-foreground/80">{content}</pre>
                                            : <p className="text-xs text-muted-foreground leading-relaxed">{content}</p>
                                          }
                                        </div>
                                      ))}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="mb-3 text-xs text-muted-foreground">Optimal Python 3 solution:</p>
                      <div className="rounded-xl bg-[#0d1117] border border-border/50 p-4 overflow-auto">
                        <pre className="text-xs font-mono text-emerald-400 leading-relaxed whitespace-pre-wrap">
                          {problem.optimal_solution_python}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>

              {/* Test Case Tracker */}
              <GlassCard className="p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Zap className="size-3.5 text-primary" />
                  <span className="text-xs font-semibold">Hidden Test Cases</span>
                  <span className="ml-auto rounded-full bg-secondary/60 px-2 py-0.5 text-[0.6rem] text-muted-foreground">
                    {problem.judge0_test_cases?.length ?? 0} cases
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {(problem.judge0_test_cases || []).map((_, i) => {
                    const result = execResult?.testResults?.[i]
                    const passed = result?.passed
                    return (
                      <motion.div
                        key={i}
                        animate={execResult ? { scale: [1, 1.2, 1] } : {}}
                        transition={{ delay: i * 0.1 }}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl text-xs font-bold border-2 transition-all ${
                          !execResult
                            ? 'border-border/50 bg-secondary/30 text-muted-foreground'
                            : passed
                            ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.2)]'
                            : 'border-rose-500/50 bg-rose-500/15 text-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.2)]'
                        }`}
                      >
                        {!execResult ? i + 1 : passed ? '✓' : '✗'}
                      </motion.div>
                    )
                  })}
                  <span className={`ml-2 text-xs font-semibold ${
                    !execResult ? 'text-muted-foreground' : execResult.passed ? 'text-emerald-400' : 'text-rose-400'
                  }`}>
                    {!execResult ? 'Run code to evaluate' : execResult.passed ? '🎉 All Tests Passed!' : `${passedCount}/${totalTests} Passed`}
                  </span>
                </div>
              </GlassCard>
            </div>

            {/* ── RIGHT: Editor + Output ───────────────────────────── */}
            <div className="space-y-4 lg:col-span-3">

              {/* Editor Card */}
              <GlassCard className="overflow-hidden p-0">
                <div className="flex items-center justify-between gap-3 border-b border-border/50 bg-secondary/20 px-5 py-3">
                  <div className="flex items-center gap-2">
                    <Code2 className="size-4 text-primary" />
                    <span className="text-sm font-bold">Solution Editor</span>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[0.65rem] font-semibold text-primary border border-primary/20">Python 3</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => { setCode(STARTER_CODE); setExecResult(null) }}
                      className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-secondary/40 px-3 py-1.5 text-xs text-muted-foreground hover:border-border hover:text-foreground transition-all"
                    >
                      <RefreshCw className="size-3" /> Reset
                    </button>
                    <button
                      onClick={runCode}
                      disabled={executing}
                      className="group relative flex items-center gap-2 overflow-hidden rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground shadow-md shadow-primary/20 transition-all hover:brightness-110 disabled:opacity-60"
                    >
                      {executing ? <Loader2 className="size-3.5 animate-spin" /> : <Play className="size-3.5" />}
                      {executing ? 'Running…' : 'Run Code'}
                    </button>
                  </div>
                </div>
                <div className="p-4">
                  <CodeEditor initial={STARTER_CODE} language="python" onChange={(v) => setCode(v || '')} />
                </div>
              </GlassCard>

              {/* Output Row */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

                {/* Console */}
                <GlassCard className="overflow-hidden p-0">
                  <div className="flex items-center gap-2 border-b border-border/50 bg-secondary/20 px-4 py-2.5">
                    <TerminalSquare className="size-3.5 text-primary" />
                    <span className="text-xs font-bold">Console</span>
                    {execResult && (
                      <span className={`ml-auto rounded-full border px-2.5 py-0.5 text-[0.6rem] font-bold ${
                        execResult.passed
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                          : 'border-rose-500/30 bg-rose-500/10 text-rose-400'
                      }`}>
                        {execResult.passed ? '✓ PASSED' : '✗ FAILED'}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    {execError && (
                      <p className="mb-2 rounded-lg bg-destructive/10 px-2 py-1.5 text-xs text-destructive">{execError}</p>
                    )}
                    <pre className="min-h-[7rem] max-h-52 overflow-auto whitespace-pre-wrap rounded-xl bg-[#0d1117] p-3 font-mono text-xs leading-relaxed text-muted-foreground">
                      {executing
                        ? 'Evaluating code against hidden test cases…'
                        : execResult
                        ? `⏱  ${execResult.timeComplexity}  |  🗂  ${execResult.spaceComplexity}\n\n${execResult.stdout}`
                        : '$ Run your solution to see output here.'}
                    </pre>
                  </div>
                </GlassCard>

                {/* Hint Panel */}
                <GlassCard className="overflow-hidden p-0">
                  <div className="flex items-center justify-between gap-2 border-b border-border/50 bg-secondary/20 px-4 py-2.5">
                    <div className="flex items-center gap-2">
                      <Lightbulb className="size-3.5 text-amber-400" />
                      <span className="text-xs font-bold">AI Hint Engine</span>
                    </div>
                    {hintResult && (
                      <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[0.6rem] font-bold text-amber-400">
                        Level {hintResult.hintLevel}
                      </span>
                    )}
                  </div>
                  <div className="p-4">
                    <AnimatePresence mode="wait">
                      {hintLoading ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex min-h-[7rem] items-center justify-center gap-2 text-xs text-muted-foreground">
                          <Loader2 className="size-4 animate-spin text-amber-400" />
                          <span>Thinking…</span>
                        </motion.div>
                      ) : hintResult ? (
                        <motion.div key="hint" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                          className="min-h-[7rem] max-h-44 overflow-auto text-xs leading-relaxed text-muted-foreground prose prose-invert prose-sm prose-p:my-1 max-w-none">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{hintResult.hint}</ReactMarkdown>
                        </motion.div>
                      ) : (
                        <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          className="min-h-[7rem] text-xs text-muted-foreground leading-relaxed">
                          Stuck? Get escalating AI hints:<br />
                          <span className="text-foreground/60 mt-1 inline-block">Conceptual → Approach → Implementation</span>
                        </motion.p>
                      )}
                    </AnimatePresence>

                    {hintError && (
                      <p className="mb-2 rounded-lg bg-destructive/10 px-2 py-1 text-xs text-destructive">
                        {hintError.includes('GROQ_API_KEY') ? 'Add GROQ_API_KEY to enable hints.' : hintError}
                      </p>
                    )}

                    <button
                      onClick={getHint}
                      disabled={hintLoading || !problem}
                      className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 py-2 text-xs font-bold text-amber-400 transition-all hover:bg-amber-500/20 hover:border-amber-500/50 disabled:opacity-40"
                    >
                      {hintLoading ? <Loader2 className="size-3.5 animate-spin" /> : <ChevronRight className="size-3.5" />}
                      Get {hintLevelLabel} Hint
                    </button>
                  </div>
                </GlassCard>
              </div>

              {/* AI Feedback */}
              <AnimatePresence>
                {execResult?.feedback && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <GlassCard className="overflow-hidden p-0">
                      <div className="flex items-center gap-2 border-b border-border/50 bg-secondary/20 px-4 py-2.5">
                        <Sparkles className="size-3.5 text-primary" />
                        <span className="text-xs font-bold">AI Code Feedback</span>
                      </div>
                      <div className="p-4 prose prose-invert prose-sm prose-p:my-1 prose-p:leading-relaxed max-w-none text-xs text-muted-foreground">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>{execResult.feedback}</ReactMarkdown>
                      </div>
                    </GlassCard>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
