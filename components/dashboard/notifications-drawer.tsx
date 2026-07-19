'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X, TriangleAlert, CheckCircle2, Info, Sparkles } from 'lucide-react'
import { notifications } from '@/lib/mock-data'

const iconFor = {
  nudge: { Icon: Sparkles, cls: 'text-primary bg-primary/15' },
  warning: { Icon: TriangleAlert, cls: 'text-warning bg-warning/15' },
  success: { Icon: CheckCircle2, cls: 'text-success bg-success/15' },
  info: { Icon: Info, cls: 'text-chart-4 bg-chart-4/15' },
} as const

export function NotificationsDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/70 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: 360 }}
            animate={{ x: 0 }}
            exit={{ x: 360 }}
            transition={{ type: 'spring', stiffness: 320, damping: 34 }}
            className="fixed inset-y-0 right-0 z-50 flex w-[92vw] max-w-sm flex-col border-l border-border bg-card"
            role="dialog"
            aria-label="Notifications"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <h2 className="font-semibold">Notifications</h2>
              <button
                onClick={onClose}
                className="grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-secondary"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto p-4">
              {notifications.map((n) => {
                const { Icon, cls } = iconFor[n.type as keyof typeof iconFor]
                return (
                  <div key={n.id} className="flex gap-3 rounded-xl border border-border/60 bg-secondary/30 p-3">
                    <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${cls}`}>
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium">{n.agent}</p>
                        <span className="shrink-0 font-mono text-[0.65rem] text-muted-foreground">{n.time}</span>
                      </div>
                      <p className="text-pretty text-sm text-muted-foreground">{n.text}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
