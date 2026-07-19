'use client'

import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { UploadCloud, FileText, CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/dashboard/glass-card'
import { RadialGauge } from '@/components/dashboard/radial-gauge'

const breakdown = [
  { label: 'Keyword match', score: 82 },
  { label: 'Formatting & parseability', score: 94 },
  { label: 'Impact & metrics', score: 76 },
  { label: 'Skills coverage', score: 88 },
]

const suggestions = [
  { type: 'warn', text: 'Add "distributed systems" and "REST APIs" — present in 80% of target JDs.' },
  { type: 'warn', text: 'Quantify 3 bullet points with measurable impact (%, latency, users).' },
  { type: 'ok', text: 'Strong action verbs detected across experience section.' },
  { type: 'ok', text: 'Single-column layout parses cleanly through ATS.' },
]

export function Resume() {
  const [file, setFile] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFiles = (files: FileList | null) => {
    if (files && files[0]) setFile(files[0].name)
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        {/* Dropzone */}
        <GlassCard className="p-6">
          <SectionHeading eyebrow="Upload" title="Drop your resume" />
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              handleFiles(e.dataTransfer.files)
            }}
            onClick={() => inputRef.current?.click()}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
            className={`grid cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-10 text-center transition-colors ${
              dragging ? 'border-primary bg-primary/10' : 'border-border bg-secondary/20 hover:border-primary/50'
            }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <motion.span
              animate={dragging ? { y: -6 } : { y: 0 }}
              className="mb-3 grid size-14 place-items-center rounded-2xl bg-primary/15 text-primary"
            >
              {file ? <FileText className="size-7" /> : <UploadCloud className="size-7" />}
            </motion.span>
            {file ? (
              <>
                <p className="font-medium">{file}</p>
                <p className="mt-1 text-sm text-success">Parsed and analyzed by Resume Agent</p>
              </>
            ) : (
              <>
                <p className="font-medium">Drag & drop, or click to browse</p>
                <p className="mt-1 text-sm text-muted-foreground">PDF, DOC or DOCX · up to 5MB</p>
              </>
            )}
          </div>
        </GlassCard>

        {/* Breakdown */}
        <GlassCard className="p-6">
          <SectionHeading eyebrow="ATS breakdown" title="Score by category" />
          <div className="space-y-4">
            {breakdown.map((b) => (
              <div key={b.label}>
                <div className="mb-1.5 flex justify-between text-sm">
                  <span>{b.label}</span>
                  <span className="font-mono text-muted-foreground">{b.score}%</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-accent"
                    initial={{ width: 0 }}
                    whileInView={{ width: `${b.score}%` }}
                    viewport={{ once: true }}
                    transition={{ duration: 1.1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Score + suggestions */}
      <div className="space-y-6">
        <GlassCard glow className="flex flex-col items-center p-6 text-center">
          <p className="mb-4 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">ATS Score</p>
          <RadialGauge value={88} suffix="" label="out of 100" color="var(--chart-2)" />
          <p className="mt-4 text-sm text-muted-foreground">Top 12% of applicants for SDE-1 roles.</p>
        </GlassCard>

        <GlassCard className="p-6">
          <SectionHeading eyebrow="Agent suggestions" title="Fix these next" />
          <ul className="space-y-3">
            {suggestions.map((s, i) => (
              <li key={i} className="flex gap-3 text-sm">
                {s.type === 'warn' ? (
                  <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
                ) : (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                )}
                <span className="text-pretty text-muted-foreground">{s.text}</span>
              </li>
            ))}
          </ul>
          <button className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
            <Sparkles className="size-4" />
            Auto-rewrite with AI
          </button>
        </GlassCard>
      </div>
    </div>
  )
}
