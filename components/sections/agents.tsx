'use client'

import { motion } from 'framer-motion'
import { Activity } from 'lucide-react'
import { GlassCard, SectionHeading } from '@/components/dashboard/glass-card'
import { AgentGraph } from '@/components/dashboard/agent-graph'

export function Agents() {
  return (
    <div className="space-y-6">
      <GlassCard className="p-6">
        <SectionHeading eyebrow="Topology" title="Agent communication graph" />
        <div className="overflow-hidden rounded-2xl border border-border/60">
          <AgentGraph height={420} />
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {[
          ['Orchestrator', 'Coordinates preparation agents'],
          ['Resume Agent', 'Resume and ATS analysis'],
          ['Coding Agent', 'DSA practice and feedback'],
          ['Aptitude Agent', 'Adaptive aptitude practice'],
          ['Interview Agent', 'Interview practice and evaluation'],
          ['Coach Agent', 'Personalized plans and guidance'],
        ].map(([name, role], i) => (
          <motion.div
            key={name}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <GlassCard className="p-5">
              <div className="flex items-center justify-between">
                <p className="font-semibold">{name}</p>
                <span className="flex items-center gap-1.5 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  <Activity className="size-3" /> Available
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{role}</p>
            </GlassCard>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
