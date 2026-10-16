'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'

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
              <p className="p-4 text-center text-sm text-muted-foreground">
                No notifications yet.
              </p>
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}
