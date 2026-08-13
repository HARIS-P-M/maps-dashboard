'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Timer, Brain, Loader2, ArrowRight, ChevronDown, ChevronRight } from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/dashboard/glass-card'
import { AnimatedCounter } from '@/components/dashboard/animated-counter'
import { useStore } from '@/lib/store'
import ReactMarkdown from 'react-markdown'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'
import remarkGfm from 'remark-gfm'
import 'katex/dist/katex.min.css'

const TOPIC_CATEGORIES: Record<string, string> = {
  'Time, Speed & Distance': 'Quantitative Aptitude',
  'Probability': 'Quantitative Aptitude',
  'Permutations & Combinations': 'Quantitative Aptitude',
  'Pipes & Cisterns': 'Quantitative Aptitude',
  'Profit & Loss': 'Quantitative Aptitude',
  'Syllogisms': 'Logical Reasoning',
  'Blood Relations': 'Logical Reasoning',
  'Number Series': 'Logical Reasoning',
  'Seating Arrangement': 'Logical Reasoning',
  'Reading Comprehension': 'Verbal Ability',
  'Sentence Correction': 'Verbal Ability',
  'Synonyms & Antonyms': 'Verbal Ability',
  'Error Spotting': 'Verbal Ability',
}

type AptitudeQuestion = {
  question: string
  options: string[]
  correctIndex: number
  keyTakeaway: string
  steps: { title: string; content: string }[]
  numericSolution?: string
  finalAnswer?: string
  solution?: string
  explanation?: string
  implementation?: string
  fullSolution?: string
}

const buildLocalFallbackQuestion = (topic: string): AptitudeQuestion => {
  if (topic === 'Time, Speed & Distance') {
    return {
      question: 'A train of length 150 m runs at 54 km/h. How much time will it take to cross a pole?',
      options: ['8 s', '10 s', '12 s', '15 s'],
      correctIndex: 1,
      keyTakeaway: 'Convert km/h to m/s before using distance ÷ speed.',
      finalAnswer: '10 s',
      numericSolution: 'Speed = 54 × 5/18 = 15 m/s; Time = 150/15 = 10 s',
      steps: [{ title: 'Step 1', content: 'Use $t = \\frac{d}{v}$ after converting units.' }],
    }
  }
  return {
    question: `In ${topic}, if an event has probability 0.3, what is the probability of its complement?`,
    options: ['0.3', '0.5', '0.7', '1.3'],
    correctIndex: 2,
    keyTakeaway: 'Complement probability is $1 - P(E)$.',
    finalAnswer: '0.7',
    numericSolution: 'P(complement) = 1 - 0.3 = 0.7',
    steps: [{ title: 'Step 1', content: 'Apply complement rule: $P(E^c)=1-P(E)$.' }],
  }
}

export function Aptitude() {
  const { aptitudeStats, recordAptitudeAttempt, addAptitudeGeneratedQuestion, getAptitudeRecentQuestions } = useStore()
  
  const [currentQuestion, setCurrentQuestion] = useState<AptitudeQuestion | null>(null)
  const [loading, setLoading] = useState(false)
  const [picked, setPicked] = useState<number | null>(null)
  const [visibleSteps, setVisibleSteps] = useState(1)
  const [selectedTopic, setSelectedTopic] = useState('Time, Speed & Distance')
  const [debugVisible, setDebugVisible] = useState(false)
  const answered = picked !== null

  const fetchNextQuestion = async (topic = selectedTopic) => {
    setLoading(true)
    setPicked(null)
    setCurrentQuestion(null)

    // Build topic accuracy map for adaptive difficulty
    const topicAccuracy: Record<string, number> = {}
    Object.entries(aptitudeStats.topics).forEach(([t, data]) => {
      if (data.total > 0) {
        topicAccuracy[t] = Math.round((data.correct / data.total) * 100)
      }
    })
    const categoryForTopic = TOPIC_CATEGORIES[topic]
    if (categoryForTopic && topicAccuracy[categoryForTopic] != null) {
      topicAccuracy[topic] = topicAccuracy[categoryForTopic]
    }

    try {
      const recentQuestions = getAptitudeRecentQuestions(topic, 20)
      const res = await fetch('/api/agents/aptitude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic,
          topicAccuracy,     // ← Send accuracy map for adaptive difficulty
          recentQuestions,   // help the API avoid repeating questions
        })
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch question')
      }
      
      if (!data.options || !Array.isArray(data.options)) {
        throw new Error('Invalid question format received from AI')
      }
      
      setCurrentQuestion(data)
      const qtext = String(data.question || '').trim()
      if (qtext) addAptitudeGeneratedQuestion(topic, qtext)
      setVisibleSteps(1)
    } catch (err: any) {
      console.warn('Aptitude Agent fallback triggered:', err.message)
      setCurrentQuestion(buildLocalFallbackQuestion(topic))
    } finally {
      setLoading(false)
    }
  }

  // Load first question on mount
  useEffect(() => {
    fetchNextQuestion(selectedTopic)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      {/* Topic mastery */}
      <div className="space-y-4 lg:col-span-1">
        {Object.entries(aptitudeStats.topics).map(([topic, stats]) => {
          const accuracy = stats.total > 0 ? Math.round((stats.correct / stats.total) * 100) : 0
          return (
            <GlassCard key={topic} className="p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{topic}</p>
                <span className="font-mono text-sm text-primary">{accuracy}%</span>
              </div>
              <div className="mt-2.5 h-2 overflow-hidden rounded-full bg-secondary">
                <motion.div
                  className="h-full rounded-full bg-primary"
                  initial={{ width: 0 }}
                  whileInView={{ width: `${accuracy}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1 }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">{stats.total} questions attempted</p>
            </GlassCard>
          )
        })}
      </div>

      {/* Active drill */}
      <div className="space-y-4 lg:col-span-2">
        <div className="grid grid-cols-3 gap-4">
          {(() => {
            const currentCategory = TOPIC_CATEGORIES[selectedTopic] || 'Quantitative Aptitude'
            const categoryStats = aptitudeStats.topics[currentCategory] || { correct: 0, total: 0 }
            
            return [
              { label: 'Global Streak', value: aptitudeStats.streak, icon: Brain, suffix: '' },
              { label: 'Category Accuracy', value: categoryStats.total > 0 ? Math.round((categoryStats.correct / categoryStats.total) * 100) : 0, icon: CheckCircle2, suffix: '%' },
              { label: 'Category Attempted', value: categoryStats.total, icon: Timer, suffix: '' },
            ].map((s) => {
            const Icon = s.icon
            return (
              <GlassCard key={s.label} className="p-4 text-center">
                <Icon className="mx-auto mb-2 size-5 text-primary" />
                <p className="text-xl font-semibold">
                  <AnimatedCounter value={s.value} suffix={s.suffix} />
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </GlassCard>
            )
          })})()}
        </div>

        <GlassCard className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <SectionHeading eyebrow="AI Generator" title="Aptitude Agent" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDebugVisible(d => !d)}
                className="rounded-full border border-primary/20 px-3 py-1 text-xs text-primary"
                title="Toggle debug metadata"
              >
                Debug
              </button>
            </div>
            <select
              value={selectedTopic}
              onChange={(e) => {
                const newTopic = e.target.value
                setSelectedTopic(newTopic)
                fetchNextQuestion(newTopic)
              }}
              className="rounded-xl border border-primary/20 bg-background/50 px-4 py-2 text-sm font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              <optgroup label="Quantitative Aptitude">
                <option value="Time, Speed & Distance">Time, Speed & Distance</option>
                <option value="Probability">Probability</option>
                <option value="Permutations & Combinations">Permutations & Combinations</option>
                <option value="Pipes & Cisterns">Pipes & Cisterns</option>
                <option value="Profit & Loss">Profit & Loss</option>
              </optgroup>
              <optgroup label="Logical Reasoning">
                <option value="Syllogisms">Syllogisms</option>
                <option value="Blood Relations">Blood Relations</option>
                <option value="Number Series">Number Series</option>
                <option value="Seating Arrangement">Seating Arrangement</option>
              </optgroup>
              <optgroup label="Verbal Ability">
                <option value="Reading Comprehension">Reading Comprehension</option>
                <option value="Sentence Correction">Sentence Correction</option>
                <option value="Synonyms & Antonyms">Synonyms & Antonyms</option>
                <option value="Error Spotting">Error Spotting</option>
              </optgroup>
            </select>
          </div>
          
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex h-64 flex-col items-center justify-center text-muted-foreground"
              >
                <Loader2 className="mb-4 size-8 animate-spin text-primary" />
                <p>Generating a unique challenging question...</p>
              </motion.div>
            ) : currentQuestion ? (
              <motion.div
                key="question"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5 mt-4"
              >
                <div className="text-pretty text-base text-foreground prose prose-invert prose-p:leading-relaxed max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkMath, remarkGfm]} 
                    rehypePlugins={[rehypeKatex]}
                  >
                    {currentQuestion.question}
                  </ReactMarkdown>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {currentQuestion.options.map((opt, i) => {
                    const isCorrect = i === Number(currentQuestion.correctIndex)
                    const state = !answered
                      ? 'idle'
                      : isCorrect
                        ? 'correct'
                        : i === picked
                          ? 'wrong'
                          : 'idle'
                    return (
                      <button
                        key={i}
                        disabled={answered}
                        onClick={() => {
                          setPicked(i)
                          const category = TOPIC_CATEGORIES[selectedTopic] || 'Quantitative Aptitude'
                          recordAptitudeAttempt(category, selectedTopic, isCorrect)
                        }}
                        className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition-colors ${
                          state === 'correct'
                            ? 'border-success/50 bg-success/15 text-foreground'
                            : state === 'wrong'
                              ? 'border-destructive/50 bg-destructive/15 text-foreground'
                              : 'border-border bg-secondary/30 hover:border-primary/50'
                        }`}
                      >
                        <span className="prose prose-invert prose-sm prose-p:my-0 max-w-none">
                          <ReactMarkdown 
                            remarkPlugins={[remarkMath, remarkGfm]} 
                            rehypePlugins={[rehypeKatex]}
                          >
                            {opt}
                          </ReactMarkdown>
                        </span>
                        {state === 'correct' && <CheckCircle2 className="size-4 text-success shrink-0 ml-3" />}
                        {state === 'wrong' && <XCircle className="size-4 text-destructive shrink-0 ml-3" />}
                      </button>
                    )
                  })}
                </div>
                {answered && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 space-y-4"
                  >
                    {/* Key Takeaway Highlight Box */}
                    <div className="rounded-xl border border-primary/20 bg-primary/10 p-4 text-sm text-foreground shadow-sm">
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {currentQuestion.keyTakeaway}
                      </ReactMarkdown>
                    </div>

                    {/* Final Answer (explicit) */}
                    {currentQuestion.finalAnswer && (
                      <div className="rounded-xl border border-primary/20 bg-secondary/20 p-3 text-sm text-foreground">
                        <p className="text-sm font-semibold text-cyan-300">Final Answer</p>
                        <p className="mt-1 font-mono text-lg">{currentQuestion.finalAnswer}</p>
                      </div>
                    )}

                    {/* Plain numeric worked solution (fallback) */}
                    {currentQuestion.numericSolution && (
                      <div className="rounded-xl border border-primary/20 bg-secondary/30 p-4 prose prose-invert max-w-none">
                        <h4 className="text-sm font-bold text-cyan-400 mb-3">Numeric Worked Solution</h4>
                        <pre className="whitespace-pre-wrap text-sm">{currentQuestion.numericSolution}</pre>
                      </div>
                    )}

                    {/* Progressive Timeline */}
                    <div className="relative border-l-2 border-primary/20 ml-4 pl-8 space-y-10 py-2">
                      {currentQuestion.steps?.slice(0, visibleSteps).map((step, idx) => (
                        <div key={idx} className="relative">
                          {/* Node indicator */}
                          <div className="absolute -left-[45px] top-0 flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 ring-4 ring-background">
                            <span className="text-xs font-bold text-primary">{idx + 1}</span>
                          </div>
                          
                          {/* High-Contrast Action Header */}
                          <h4 className="text-sm font-bold text-cyan-400 mb-3">{step.title}</h4>
                          
                          {/* Isolated Math Blocks styling via Tailwind arbitrary variants */}
                          <div className="px-1 text-sm text-muted-foreground prose prose-sm prose-invert max-w-none math-markdown
                            [&_.math-display]:my-4 [&_.math-display]:rounded-xl [&_.math-display]:border [&_.math-display]:border-primary/20 
                            [&_.math-display]:bg-secondary/40 [&_.math-display]:p-4 [&_.math-display]:flex [&_.math-display]:justify-center [&_.math-display]:shadow-sm
                            [&_strong]:text-foreground [&_strong]:font-bold
                          ">
                            <ReactMarkdown 
                              remarkPlugins={[remarkMath, remarkGfm]} 
                              rehypePlugins={[rehypeKatex]}
                            >
                              {step.content}
                            </ReactMarkdown>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Progressive Disclosure Button */}
                    {(currentQuestion.steps && visibleSteps < currentQuestion.steps.length) && (
                      <button
                        onClick={() => setVisibleSteps(s => s + 1)}
                        className="ml-4 mt-2 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
                      >
                        View Next Step <ChevronDown className="size-4" />
                      </button>
                    )}
                    {/* Render full implementation/explanation if the agent provided one */}
                    {(currentQuestion?.solution || currentQuestion?.explanation || currentQuestion?.implementation || currentQuestion?.fullSolution) && (
                      <div className="mt-4">
                        <h4 className="text-sm font-bold text-cyan-400 mb-3">Full Implementation</h4>
                        <div className="rounded-xl border border-primary/20 bg-secondary/30 p-4 prose prose-invert max-w-none">
                          <ReactMarkdown
                            remarkPlugins={[remarkMath, remarkGfm]}
                            rehypePlugins={[rehypeKatex]}
                          >
                            {currentQuestion?.solution || currentQuestion?.explanation || currentQuestion?.implementation || currentQuestion?.fullSolution}
                          </ReactMarkdown>
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => fetchNextQuestion(selectedTopic)}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90"
                    >
                      Generate Next Question <ArrowRight className="size-4" />
                    </button>
                    {/* Debug panel (developer only) */}
                    {debugVisible && (
                      <div className="mt-4 rounded-lg border border-secondary p-3 bg-background/60 text-xs text-muted-foreground">
                        <h5 className="font-semibold text-sm mb-2">AI Debug Metadata</h5>
                        <pre className="whitespace-pre-wrap text-xs mb-2">{JSON.stringify({ _raw: (currentQuestion as any)?._raw, _note: (currentQuestion as any)?._note, _generatedBy: (currentQuestion as any)?._generatedBy, _adaptive: (currentQuestion as any)?._adaptive }, null, 2)}</pre>
                      </div>
                    )}
                  </motion.div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </GlassCard>
      </div>
    </div>
  )
}
