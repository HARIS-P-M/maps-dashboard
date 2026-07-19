'use client'

import { motion } from 'framer-motion'
import { Activity, Cpu, Zap } from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/dashboard/glass-card'
import { AgentGraph } from '@/components/dashboard/agent-graph'
import { AnimatedCounter } from '@/components/dashboard/animated-counter'
import { agents } from '@/lib/mock-data'

export function Agents() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: 'Active agents', value: 5, icon: Activity },
          { label: 'Tasks / hour', value: 128, icon: Zap },
          { label: 'Avg. latency (ms)', value: 340, icon: Cpu },
        ].map((s) => {
          const Icon = s.icon
          return (
            <GlassCard key={s.label} className="flex items-center gap-4 p-5">
              <span className="grid size-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="text-2xl font-semibold">
                  <AnimatedCounter value={s.value} />
                </p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </GlassCard>
          )
        })}
      </div>

      <GlassCard className="p-6">
        <SectionHeading eyebrow="Topology" title="Agent communication graph" />
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <AgentGraph height={420} />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {agents.map((a, i) => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{a.name}</p>
                <span
                  className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${
                    a.status === 'active' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <span className={`size-1.5 rounded-full ${a.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}`} />
                  {a.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{a.role}</p>
              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                  <span>Load</span>
                  <span>{a.load}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-secondary">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${a.load}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
