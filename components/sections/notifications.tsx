"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { GlassCard } from "@/components/dashboard/glass-card"
import { notifications as seed } from "@/lib/mock-data"
import { AlertTriangle, CheckCircle2, Info, Sparkles, X } from "lucide-react"

const typeMeta: Record<string, { icon: typeof Info; color: string }> = {
  nudge: { icon: Sparkles, color: "var(--primary)" },
  warning: { icon: AlertTriangle, color: "var(--chart-4)" },
  success: { icon: CheckCircle2, color: "var(--chart-2)" },
  info: { icon: Info, color: "var(--chart-1)" },
}

export function NotificationsSection() {
  const [items, setItems] = useState(seed)

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <GlassCard className="flex items-center justify-between p-5">
        <div>
          <h2 className="text-lg font-semibold">Notifications</h2>
          <p className="text-sm text-muted-foreground">{items.length} unread from your AI agents</p>
        </div>
        <button
          onClick={() => setItems([])}
          className="rounded-lg border border-border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
        >
          Clear all
        </button>
      </GlassCard>

      <AnimatePresence mode="popLayout">
        {items.map((n) => {
          const meta = typeMeta[n.type] ?? typeMeta.info
          const Icon = meta.icon
          return (
            <motion.div
              key={n.id}
              layout
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
            >
              <GlassCard className="flex items-start gap-4 p-4">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `color-mix(in oklch, ${meta.color} 16%, transparent)` }}
                >
                  <Icon className="h-4.5 w-4.5" style={{ color: meta.color }} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium">{n.agent}</p>
                    <span className="shrink-0 text-xs text-muted-foreground">{n.time}</span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.text}</p>
                </div>
                <button
                  onClick={() => setItems((prev) => prev.filter((x) => x.id !== n.id))}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </GlassCard>
            </motion.div>
          )
        })}
      </AnimatePresence>

      {items.length === 0 && (
        <GlassCard className="p-10 text-center text-sm text-muted-foreground">You&apos;re all caught up.</GlassCard>
      )}
    </div>
  )
}
