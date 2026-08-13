'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Video, Mic, Square, Circle, Play, Bot,
  Sparkles, Loader2, CheckCircle2, AlertTriangle, ArrowRight,
} from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/dashboard/glass-card'
import { useStore } from '@/lib/store'
import { useAgent } from '@/lib/agents/use-agent'

// ─── Types ────────────────────────────────────────────────────────────────────

type InterviewResult = {
  overallScore: number
  scores: { starStructure: number; clarity: number; confidence: number; relevance: number }
  fillerWords: string[]
  strengths: string[]
  improvements: string[]
  improvedAnswer: string
  idealAnswer?: string // Made optional for backward compatibility with old mocks
  verdict: 'strong' | 'needs-work' | 'weak'
}

type Question = {
  q: string
  tag: string
}

// Global declaration for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any
    webkitSpeechRecognition: any
  }
}

// ─── Data ─────────────────────────────────────────────────────────────────────

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const verdictStyle = {
  strong: 'bg-success/15 text-success border-success/30',
  'needs-work': 'bg-warning/15 text-warning border-warning/30',
  weak: 'bg-destructive/15 text-destructive border-destructive/30',
}

// ─── Component ────────────────────────────────────────────────────────────────

export function Interview() {
  const { resumeText, jdText, targetRole, targetCompany, interviewHistory, addInterviewEval } = useStore()
  const [questions, setQuestions] = useState<Question[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)
  const [sessionEvals, setSessionEvals] = useState<InterviewResult[]>([])

  const [recording, setRecording] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [qIndex, setQIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [showImproved, setShowImproved] = useState(false)
  const [speechError, setSpeechError] = useState<string | null>(null)
  
  const recognitionRef = useRef<any>(null)
  const recognitionStateRef = useRef<'idle' | 'starting' | 'recording' | 'stopping'>('idle')

  const { call, data: result, isLoading, error, reset } = useAgent<InterviewResult>('interview')

  // When result arrives, save it to the persistent store for cross-agent intelligence
  const prevResultRef = useRef<InterviewResult | null>(null)
  useEffect(() => {
    if (result && result !== prevResultRef.current) {
      prevResultRef.current = result
      const currentQuestion = questions[qIndex]
      if (currentQuestion) {
        addInterviewEval({
          question: currentQuestion.q,
          overallScore: result.overallScore,
          scores: result.scores,
          verdict: result.verdict,
          evaluatedAt: new Date().toISOString(),
        })
        setSessionEvals((prev) => [...prev, result])
      }
    }
  }, [result, questions, qIndex, addInterviewEval])

  useEffect(() => {
    async function generateQuestions() {
      setIsGenerating(true)
      setGenError(null)
      try {
        const res = await fetch('/api/agents/generate-questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resumeText, jdText, targetRole })
        })
        if (!res.ok) throw new Error('Failed to generate questions')
        const data = await res.json()
        setQuestions(data)
      } catch (err: any) {
        setGenError(err.message)
        // Fallback generic questions if AI generation fails
        setQuestions([
          { q: 'Tell me about a time you handled a production incident.', tag: 'Behavioral' },
          { q: 'Design a URL shortener. Walk me through the data model.', tag: 'System Design' },
          { q: 'Why do you want to join our team specifically?', tag: 'Motivational' },
        ])
      } finally {
        setIsGenerating(false)
      }
    }
    
    // Only generate once when component mounts
    generateQuestions()
  }, [resumeText, jdText, targetRole])

  useEffect(() => {
    if (!recording) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [recording])

  useEffect(() => {
    // Initialize Speech Recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition()
        recognitionRef.current.continuous = true
        recognitionRef.current.interimResults = true
        recognitionRef.current.onstart = () => {
          recognitionStateRef.current = 'recording'
          setRecording(true)
        }

        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = ''
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript + ' '
            }
          }
          if (finalTranscript) {
            setAnswer((prev) => prev + finalTranscript)
          }
        }

        recognitionRef.current.onerror = (event: any) => {
          if (event.error === 'no-speech') {
            // Ignore no-speech errors (common when user is silent)
            return
          }
          console.error('Speech recognition error', event.error)
          if (event.error === 'not-allowed') {
            setSpeechError('Microphone access denied. Please allow microphone permissions in your browser.')
          } else {
            setSpeechError(`Microphone error: ${event.error}`)
          }
          recognitionStateRef.current = 'idle'
          setRecording(false)
        }
        
        recognitionRef.current.onend = () => {
          recognitionStateRef.current = 'idle'
          setRecording(false)
        }
      } else {
        setSpeechError('Voice-to-text is not supported in this browser. Try Chrome or Edge.')
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
        recognitionStateRef.current = 'idle'
        recognitionRef.current.onstart = null
        recognitionRef.current.onresult = null
        recognitionRef.current.onerror = null
        recognitionRef.current.onend = null
      }
    }
  }, [])

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      setSpeechError('Voice-to-text is not supported in this browser. Try Chrome or Edge.')
      return
    }

    const state = recognitionStateRef.current
    if (state === 'starting' || state === 'stopping') {
      return
    }

    if (state === 'recording' || recording) {
      recognitionStateRef.current = 'stopping'
      recognitionRef.current.stop()
      setRecording(false)
    } else {
      setSpeechError(null)
      try {
        recognitionStateRef.current = 'starting'
        recognitionRef.current.start()
        setSeconds(0)
      } catch (err: any) {
        recognitionStateRef.current = 'idle'
        console.error('Failed to start recording', err)
        if (err?.name === 'InvalidStateError') {
          // start() called while recognition is already active/stopping in the browser internals
          setRecording(true)
        } else {
          setSpeechError('Failed to start microphone. Please try again.')
        }
      }
    }
  }

  const handleNextQuestion = (dir: number) => {
    if (questions.length === 0) return
    const next = Math.max(0, Math.min(questions.length - 1, qIndex + dir))
    setQIndex(next)
    setAnswer('')
    setSeconds(0)
    setShowImproved(false)
    reset()
  }

  const submitAnswer = async () => {
    if (!answer.trim()) return
    // Pass real target role/company + session history for improvement tracking
    await call({
      question: questions[qIndex]?.q,
      userAnswer: answer,
      role: targetRole,
      company: targetCompany || 'a top tech company',
      resumeText: resumeText.slice(0, 1500),
      sessionHistory: sessionEvals.map((e, i) => ({
        question: questions[i]?.q ?? 'Question',
        overallScore: e.overallScore,
        verdict: e.verdict,
      })),
    })
  }

  const scoreColor = (v: number) =>
    v >= 8 ? 'text-success' : v >= 6 ? 'text-warning' : 'text-destructive'

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">

        {/* Recorder */}
        <GlassCard className="overflow-hidden">
          <div className="relative grid aspect-video place-items-center bg-gradient-to-br from-secondary/60 to-background">
            <div className="grid-bg absolute inset-0 opacity-40" />
            <div className="relative flex flex-col items-center gap-4">
              <motion.div
                animate={recording ? { scale: [1, 1.08, 1] } : {}}
                transition={{ repeat: Infinity, duration: 1.6 }}
                className="grid size-24 place-items-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/30"
              >
                <Video className="size-10" />
              </motion.div>
              <p className="text-sm text-muted-foreground">
                {recording ? 'Recording your response…' : 'Camera & mic ready'}
              </p>
            </div>
            {recording && (
              <div className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-destructive/20 px-3 py-1 text-xs font-medium text-destructive">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 1.2 }}
                  className="size-2 rounded-full bg-destructive"
                />
                REC {fmt(seconds)}
              </div>
            )}
            {speechError && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 rounded-full bg-destructive/90 px-4 py-2 text-xs font-medium text-white shadow-lg backdrop-blur-md">
                {speechError}
              </div>
            )}
          </div>
          <div className="flex items-center justify-center gap-3 p-5">
            <button
              onClick={toggleRecording}
              className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium transition-colors ${
                recording ? 'bg-destructive text-white shadow-lg shadow-destructive/30' : 'bg-primary text-primary-foreground hover:opacity-90'
              }`}
            >
              {recording ? <Square className="size-4" /> : <Mic className="size-4" />}
              {recording ? 'Stop recording' : 'Start speaking'}
            </button>
            <button className="grid size-10 place-items-center rounded-xl bg-secondary text-muted-foreground hover:text-foreground">
              <Play className="size-4" />
            </button>
          </div>
        </GlassCard>

        {/* Question + answer input */}
        <GlassCard className="p-6">
          {isGenerating ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="mb-4 size-8 animate-spin text-primary" />
              <p className="text-sm font-medium">Generating targeted questions...</p>
              <p className="text-xs">Analyzing your resume and target role</p>
            </div>
          ) : questions.length > 0 ? (
            <>
              <div className="flex items-center justify-between">
                <SectionHeading eyebrow={`Question ${qIndex + 1} of ${questions.length} · ${questions[qIndex].tag}`} title="Interview Agent asks" />
              </div>
              <div className="mt-3 flex items-start gap-3 rounded-xl bg-secondary/40 p-4">
                <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                  <Bot className="size-5" />
                </span>
                <p className="text-pretty text-base">{questions[qIndex].q}</p>
              </div>

          {/* Text answer input */}
          <div className="mt-4 space-y-3">
            <label className="text-xs font-medium text-muted-foreground">Type your answer for AI evaluation</label>
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={4}
              placeholder="Describe the situation, your actions, and the outcome using the STAR method…"
              className="w-full resize-none rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm leading-relaxed outline-none focus:ring-1 focus:ring-primary placeholder:text-muted-foreground/60"
            />
            <div className="flex justify-between gap-2">
              <div className="flex gap-2">
                <button
                  onClick={() => handleNextQuestion(-1)}
                  disabled={qIndex === 0}
                  className="rounded-lg border border-border px-4 py-2 text-sm hover:bg-secondary disabled:opacity-40"
                >Previous</button>
                <button
                  onClick={() => handleNextQuestion(1)}
                  disabled={qIndex === questions.length - 1}
                  className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 disabled:opacity-40"
                >Next question</button>
              </div>
              <button
                onClick={submitAnswer}
                disabled={!answer.trim() || isLoading}
                className="flex items-center gap-2 rounded-xl bg-chart-3/90 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
              >
                {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {isLoading ? 'Evaluating…' : 'AI Evaluate'}
              </button>
            </div>
            {error && (
              <p className="rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error.includes('GROQ_API_KEY') ? 'Add your GROQ_API_KEY to enable interview evaluation.' : error}
              </p>
            )}
          </div>
          </>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Failed to load questions. {genError}
            </div>
          )}
        </GlassCard>
      </div>

      {/* AI Feedback Panel */}
      <div className="space-y-4">
        <GlassCard className="h-fit p-6">
          <SectionHeading eyebrow="Interview Agent" title="AI feedback" />

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-3 py-8 text-sm text-muted-foreground">
                <Loader2 className="size-6 animate-spin text-primary" />
                Evaluating your answer…
              </motion.div>
            ) : result ? (
              <motion.div key="result" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                {/* Overall score */}
                <div className="flex items-baseline justify-between">
                  <span className={`text-4xl font-semibold ${scoreColor(result.overallScore)}`}>
                    {result.overallScore}
                  </span>
                  <span className="text-sm text-muted-foreground">/ 10 overall</span>
                  <span className={`rounded-full border px-3 py-1 text-xs font-semibold capitalize ${verdictStyle[result.verdict]}`}>
                    {result.verdict.replace('-', ' ')}
                  </span>
                </div>

                {/* Dimension scores */}
                <div className="space-y-3">
                  {(Object.entries(result.scores) as [string, number][]).map(([key, val]) => (
                    <div key={key}>
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                        <span className="font-mono text-muted-foreground">{val}/10</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
                        <motion.div
                          className="h-full rounded-full bg-primary"
                          initial={{ width: 0 }}
                          animate={{ width: `${val * 10}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Filler words */}
                {result.fillerWords?.length > 0 && (
                  <div>
                    <p className="mb-1.5 text-xs font-medium text-muted-foreground">Filler words detected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {result.fillerWords.map((w, i) => (
                        <span key={i} className="rounded-full bg-destructive/10 px-2 py-0.5 text-xs text-destructive">{w}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Strengths */}
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Strengths</p>
                  <ul className="space-y-1">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-success" />{s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improvements */}
                <div>
                  <p className="mb-1.5 text-xs font-medium text-muted-foreground">Improve next time</p>
                  <ul className="space-y-1">
                    {result.improvements.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                        <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />{s}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Improved answer toggle */}
                <div className="space-y-3">
                  <button
                    onClick={() => setShowImproved((s) => !s)}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 py-2 text-xs font-semibold text-primary hover:bg-primary/20"
                  >
                    {showImproved ? 'Hide Answers' : 'Show Answers'} <ArrowRight className={`size-3.5 transition-transform ${showImproved ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showImproved && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4 overflow-hidden"
                      >
                        <div className="rounded-xl border border-border bg-secondary/20 p-4">
                          <h4 className="mb-2 text-xs font-semibold text-foreground flex items-center gap-2">
                            <Sparkles className="size-3.5 text-primary" /> Your Improved Answer
                          </h4>
                          <p className="text-xs leading-relaxed text-muted-foreground">
                            {result.improvedAnswer}
                          </p>
                        </div>
                        
                        {result.idealAnswer && (
                          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                            <h4 className="mb-2 text-xs font-semibold text-primary flex items-center gap-2">
                              <CheckCircle2 className="size-3.5" /> Ideal Benchmark Answer
                            </h4>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                              {result.idealAnswer}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.p key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-6 text-sm text-muted-foreground">
                Answer a question on the left and click <span className="text-primary font-medium">AI Evaluate</span> to get real STAR-method feedback from the Interview Agent.
              </motion.p>
            )}
          </AnimatePresence>
        </GlassCard>
      </div>
    </div>
  )
}
