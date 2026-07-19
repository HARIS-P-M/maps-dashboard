'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, CheckCircle2, Circle, Lightbulb, TerminalSquare } from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/dashboard/glass-card'
import { CodeEditor } from '@/components/dashboard/code-editor'

const starter = `class Solution:
    def twoSum(self, nums: list[int], target: int) -> list[int]:
        seen = {}
        for i, n in enumerate(nums):
            if target - n in seen:
                return [seen[target - n], i]
            seen[n] = i
        return []`

const problems = [
  { id: 1, title: 'Two Sum', diff: 'Easy', done: true },
  { id: 2, title: 'Longest Substring', diff: 'Medium', done: true },
  { id: 3, title: 'Coin Change', diff: 'Medium', done: false, active: true },
  { id: 4, title: 'Word Ladder', diff: 'Hard', done: false },
  { id: 5, title: 'LRU Cache', diff: 'Medium', done: false },
]

const diffColor: Record<string, string> = {
  Easy: 'text-success',
  Medium: 'text-warning',
  Hard: 'text-destructive',
}

export function Coding() {
  const [output, setOutput] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  const run = () => {
    setRunning(true)
    setOutput(null)
    setTimeout(() => {
      setRunning(false)
      setOutput('✓ 42 / 42 test cases passed\nRuntime: 48 ms (beats 96.4%)\nMemory: 17.1 MB (beats 71.2%)')
    }, 1200)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
      {/* Problem list */}
      <GlassCard className="p-5 lg:col-span-1">
        <SectionHeading eyebrow="Set: Blind 75" title="Problems" />
        <ul className="space-y-1.5">
          {problems.map((p) => (
            <li key={p.id}>
              <button
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                  p.active ? 'bg-primary/15 text-foreground' : 'hover:bg-secondary/60'
                }`}
              >
                {p.done ? (
                  <CheckCircle2 className="size-4 shrink-0 text-success" />
                ) : (
                  <Circle className="size-4 shrink-0 text-muted-foreground/50" />
                )}
                <span className="flex-1 truncate">{p.title}</span>
                <span className={`text-xs ${diffColor[p.diff]}`}>{p.diff}</span>
              </button>
            </li>
          ))}
        </ul>
      </GlassCard>

      {/* Editor + statement */}
      <div className="space-y-4 lg:col-span-3">
        <GlassCard className="p-6">
          <div className="mb-4 flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">3. Coin Change</h2>
              <span className="text-sm text-warning">Medium · Dynamic Programming</span>
            </div>
            <button
              onClick={run}
              disabled={running}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Play className="size-4" />
              {running ? 'Running…' : 'Run'}
            </button>
          </div>
          <p className="mb-4 text-pretty text-sm text-muted-foreground">
            Given an array of coin denominations and a total amount, return the fewest number of coins needed to make up
            that amount. Return -1 if it cannot be formed.
          </p>
          <CodeEditor initial={starter} language="python" />
        </GlassCard>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <TerminalSquare className="size-4 text-primary" /> Console
            </div>
            <pre className="min-h-24 whitespace-pre-wrap rounded-xl bg-secondary/40 p-4 font-mono text-xs text-muted-foreground">
              {running ? 'Compiling and running test cases…' : output ?? 'Run your solution to see results.'}
            </pre>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="size-4 text-warning" /> Coding Agent hint
            </div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-pretty text-sm text-muted-foreground"
            >
              Think bottom-up: define <span className="font-mono text-primary">dp[a]</span> as the fewest coins for amount{' '}
              <span className="font-mono text-primary">a</span>. Initialize with infinity, and build up from 0 using each
              coin denomination.
            </motion.p>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
