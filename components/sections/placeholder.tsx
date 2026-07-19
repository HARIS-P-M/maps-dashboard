'use client'

import { Loader2 } from 'lucide-react'
import { GlassCard } from '@/components/dashboard/glass-card'

export function Placeholder({ title }: { title: string }) {
  return (
    <GlassCard className="grid min-h-[50vh] place-items-center p-10 text-center">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="size-6 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Agents are assembling {title}…</p>
      </div>
    </GlassCard>
  )
}
