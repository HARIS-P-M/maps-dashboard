// lib/store.ts
// Unified Student Intelligence Context — shared by ALL agents
// Every performance event updates this store. Agents read from it.

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ResumeAnalysis {
  overallScore: number
  jdMatchScore: number | null
  keywordGaps: string[]
  atsFixes: { issue: string; fix: string; priority: string }[]
  summary: string
  analyzedAt: string
}

export interface InterviewEval {
  question: string
  overallScore: number
  scores: { starStructure: number; clarity: number; confidence: number; relevance: number }
  verdict: 'strong' | 'needs-work' | 'weak'
  evaluatedAt: string
}

export interface CodingSession {
  problemTitle: string
  topic: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  passed: boolean
  company: string
  solvedAt: string
}

// ─── Store Interface ──────────────────────────────────────────────────────────

interface MapsStore {
  // ── Resume ─────────────────────────────────────────────────────────────────
  resumeText: string
  setResumeText: (text: string) => void

  jdText: string
  setJdText: (text: string) => void

  resumeAnalysis: ResumeAnalysis | null
  setResumeAnalysis: (analysis: ResumeAnalysis) => void

  // ── Target ─────────────────────────────────────────────────────────────────
  targetRole: string
  setTargetRole: (role: string) => void

  targetCompany: string
  setTargetCompany: (company: string) => void

  // ── Coach / Roadmap ────────────────────────────────────────────────────────
  coachData: any | null
  setCoachData: (data: any) => void
  coachGeneratedAt: string | null

  isGeneratingCoach: boolean
  setIsGeneratingCoach: (isGen: boolean) => void

  // ── Task Completion (persisted) ────────────────────────────────────────────
  completedTaskIds: Set<string>
  toggleTask: (taskId: string) => void

  // ── Aptitude ───────────────────────────────────────────────────────────────
  aptitudeStats: {
    streak: number
    correct: number
    total: number
    lastActivityDate: string | null
    topics: Record<string, { correct: number; total: number }>
  }
  recordAptitudeAttempt: (topic: string, subtopic: string, isCorrect: boolean) => void
  aptitudeQuestionHistory: Record<string, string[]>
  addAptitudeGeneratedQuestion: (topic: string, question: string) => void
  getAptitudeRecentQuestions: (topic: string, limit?: number) => string[]

  // ── Interview ──────────────────────────────────────────────────────────────
  interviewHistory: InterviewEval[]
  addInterviewEval: (eval_: InterviewEval) => void
  clearInterviewHistory: () => void

  // ── Coding ────────────────────────────────────────────────────────────────
  codingSessions: CodingSession[]
  addCodingSession: (session: CodingSession) => void

  // ── Computed Live Stats (getters) ─────────────────────────────────────────
  getLiveAtsScore: () => number
  getLiveInterviewScore: () => number
  getLiveAptitudeScore: () => number
  getLiveCodingScore: () => number
  getLivePlacementProb: () => number
  getLiveStreak: () => number

  // ── Student Context Snapshot (sent to all agents) ─────────────────────────
  getStudentContext: () => StudentContext
}

export interface StudentContext {
  resumeScore: number
  jdMatchScore: number | null
  keywordGaps: string[]
  aptitudeAccuracy: Record<string, number>     // topic → % correct
  aptitudeWeakTopics: string[]                 // topics with < 50% accuracy
  interviewAvgScore: number
  interviewHistory: { question: string; score: number; verdict: string }[]
  codingProblemsAttempted: number
  codingSuccessRate: number
  codingTopicsCovered: string[]
  targetRole: string
  targetCompany: string
  placementProbability: number
}

// ─── Store Implementation ─────────────────────────────────────────────────────

export const useStore = create<MapsStore>()(
  persist(
    (set, get) => ({
      // ── Resume ──────────────────────────────────────────────────────────────
      resumeText: '',
      setResumeText: (text) => set({ resumeText: text }),

      jdText: '',
      setJdText: (text) => set({ jdText: text }),

      resumeAnalysis: null,
      setResumeAnalysis: (analysis) => set({ resumeAnalysis: analysis }),

      // ── Target ──────────────────────────────────────────────────────────────
      targetRole: 'Software Engineer',
      setTargetRole: (role) => set({ targetRole: role }),

      targetCompany: 'Kaar Technologies (GE 27 Batch)',
      setTargetCompany: (company) => set({ targetCompany: company }),

      // ── Coach ───────────────────────────────────────────────────────────────
      coachData: null,
      coachGeneratedAt: null,
      setCoachData: (data) => set({ coachData: data, coachGeneratedAt: new Date().toISOString() }),

      isGeneratingCoach: false,
      setIsGeneratingCoach: (isGen) => set({ isGeneratingCoach: isGen }),

      // ── Tasks ───────────────────────────────────────────────────────────────
      completedTaskIds: new Set<string>(),
      toggleTask: (taskId) =>
        set((state) => {
          const next = new Set(state.completedTaskIds)
          if (next.has(taskId)) next.delete(taskId)
          else next.add(taskId)
          return { completedTaskIds: next }
        }),

      // ── Aptitude ────────────────────────────────────────────────────────────
      aptitudeStats: {
        streak: 0,
        correct: 0,
        total: 0,
        lastActivityDate: null,
        topics: {
          'Quantitative Aptitude': { correct: 0, total: 0 },
          'Logical Reasoning': { correct: 0, total: 0 },
          'Verbal Ability': { correct: 0, total: 0 },
        },
      },
      recordAptitudeAttempt: (topic, _subtopic, isCorrect) =>
        set((state) => {
          const stats = state.aptitudeStats
          const topicStats = stats.topics[topic] || { correct: 0, total: 0 }
          const today = new Date().toDateString()
          const lastDate = stats.lastActivityDate
          // Streak: continues if last activity was today or yesterday
          const isNewDay = lastDate !== today
          const yesterday = new Date(Date.now() - 86400000).toDateString()
          const streakContinues = lastDate === today || lastDate === yesterday
          const newStreak = isCorrect
            ? (isNewDay && streakContinues ? stats.streak + 1 : isNewDay ? 1 : stats.streak)
            : 0

          return {
            aptitudeStats: {
              ...stats,
              streak: newStreak,
              correct: stats.correct + (isCorrect ? 1 : 0),
              total: stats.total + 1,
              lastActivityDate: today,
              topics: {
                ...stats.topics,
                [topic]: {
                  correct: topicStats.correct + (isCorrect ? 1 : 0),
                  total: topicStats.total + 1,
                },
              },
            },
          }
        }),
      aptitudeQuestionHistory: {},
      addAptitudeGeneratedQuestion: (topic, question) =>
        set((state) => {
          const cleanTopic = String(topic || '').trim()
          const cleanQuestion = String(question || '').trim()
          if (!cleanTopic || !cleanQuestion) return {}

          const tagged = `${cleanTopic}::${cleanQuestion}`
          const current = state.aptitudeQuestionHistory[cleanTopic] || []
          const exists = current.includes(tagged)
          const nextList = exists ? current : [...current, tagged].slice(-40)

          return {
            aptitudeQuestionHistory: {
              ...state.aptitudeQuestionHistory,
              [cleanTopic]: nextList,
            },
          }
        }),
      getAptitudeRecentQuestions: (topic, limit = 15) => {
        const cleanTopic = String(topic || '').trim()
        const list = get().aptitudeQuestionHistory[cleanTopic] || []
        return list.slice(-Math.max(1, limit))
      },

      // ── Interview ───────────────────────────────────────────────────────────
      interviewHistory: [],
      addInterviewEval: (eval_) =>
        set((state) => ({
          interviewHistory: [eval_, ...state.interviewHistory].slice(0, 20), // keep last 20
        })),
      clearInterviewHistory: () => set({ interviewHistory: [] }),

      // ── Coding ──────────────────────────────────────────────────────────────
      codingSessions: [],
      addCodingSession: (session) =>
        set((state) => ({
          codingSessions: [session, ...state.codingSessions].slice(0, 100),
        })),

      // ── Live Stat Computations ───────────────────────────────────────────────
      getLiveAtsScore: () => {
        const { resumeAnalysis } = get()
        return resumeAnalysis?.overallScore ?? 0
      },

      getLiveInterviewScore: () => {
        const { interviewHistory } = get()
        if (interviewHistory.length === 0) return 0
        const avg = interviewHistory.reduce((s, e) => s + e.overallScore, 0) / interviewHistory.length
        return Math.round(avg * 10) // scale to 0-100
      },

      getLiveAptitudeScore: () => {
        const { aptitudeStats } = get()
        if (aptitudeStats.total === 0) return 0
        return Math.round((aptitudeStats.correct / aptitudeStats.total) * 100)
      },

      getLiveCodingScore: () => {
        const { codingSessions } = get()
        if (codingSessions.length === 0) return 0
        const passed = codingSessions.filter((s) => s.passed).length
        // Scale to 0-100 based on: count * quality + success rate
        const successRate = passed / codingSessions.length
        const volume = Math.min(codingSessions.length / 50, 1) // 50 problems = 100%
        return Math.round((successRate * 0.6 + volume * 0.4) * 100)
      },

      getLivePlacementProb: () => {
        const s = get()
        const ats = s.getLiveAtsScore()
        const interview = s.getLiveInterviewScore()
        const aptitude = s.getLiveAptitudeScore()
        const coding = s.getLiveCodingScore()

        // Weighted formula: resume 30%, coding 30%, interview 25%, aptitude 15%
        const hasAny = ats > 0 || interview > 0 || aptitude > 0 || coding > 0
        if (!hasAny) return 0

        const weighted = ats * 0.30 + coding * 0.30 + interview * 0.25 + aptitude * 0.15
        return Math.min(99, Math.round(weighted))
      },

      getLiveStreak: () => {
        return get().aptitudeStats.streak
      },

      // ── Student Context Snapshot ─────────────────────────────────────────────
      getStudentContext: (): StudentContext => {
        const s = get()
        const { aptitudeStats, interviewHistory, codingSessions, resumeAnalysis } = s

        // Topic-level accuracy
        const aptitudeAccuracy: Record<string, number> = {}
        const aptitudeWeakTopics: string[] = []
        Object.entries(aptitudeStats.topics).forEach(([topic, data]) => {
          if (data.total > 0) {
            const acc = Math.round((data.correct / data.total) * 100)
            aptitudeAccuracy[topic] = acc
            if (acc < 50) aptitudeWeakTopics.push(topic)
          }
        })

        // Coding topics
        const topicSet = new Set(codingSessions.map((s) => s.topic))
        const passedSessions = codingSessions.filter((s) => s.passed)

        return {
          resumeScore: resumeAnalysis?.overallScore ?? 0,
          jdMatchScore: resumeAnalysis?.jdMatchScore ?? null,
          keywordGaps: resumeAnalysis?.keywordGaps ?? [],
          aptitudeAccuracy,
          aptitudeWeakTopics,
          interviewAvgScore: s.getLiveInterviewScore() / 10, // back to 0-10
          interviewHistory: interviewHistory.slice(0, 5).map((e) => ({
            question: e.question,
            score: e.overallScore,
            verdict: e.verdict,
          })),
          codingProblemsAttempted: codingSessions.length,
          codingSuccessRate: codingSessions.length > 0
            ? Math.round((passedSessions.length / codingSessions.length) * 100)
            : 0,
          codingTopicsCovered: Array.from(topicSet),
          targetRole: s.targetRole,
          targetCompany: s.targetCompany,
          placementProbability: s.getLivePlacementProb(),
        }
      },
    }),
    {
      name: 'maps-storage-v2',
      // Serialize Set as Array for JSON storage
      storage: {
        getItem: (name) => {
          const str = localStorage.getItem(name)
          if (!str) return null
          const parsed = JSON.parse(str)
          // Re-hydrate completedTaskIds from array back to Set
          if (parsed.state?.completedTaskIds) {
            parsed.state.completedTaskIds = new Set(parsed.state.completedTaskIds)
          }
          return parsed
        },
        setItem: (name, value) => {
          // Serialize Set as Array
          const toStore = {
            ...value,
            state: {
              ...value.state,
              completedTaskIds: Array.from(value.state.completedTaskIds ?? []),
            },
          }
          localStorage.setItem(name, JSON.stringify(toStore))
        },
        removeItem: (name) => localStorage.removeItem(name),
      },
    }
  )
)
