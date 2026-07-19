'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ThemeProvider } from './theme-context'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { AiAssistant } from './ai-assistant'
import { NotificationsDrawer } from './notifications-drawer'
import { SectionRouter } from '@/components/sections/section-router'
import type { ViewId } from '@/lib/nav'

export function DashboardShell() {
  const [view, setView] = useState<ViewId>('dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  return (
    <ThemeProvider>
      <div className="relative flex min-h-dvh bg-background text-foreground">
        {/* Ambient animated aura background */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="animate-aura absolute -left-40 -top-40 size-[38rem] rounded-full bg-primary/12 blur-[120px]" />
          <div
            className="animate-aura absolute -bottom-52 -right-40 size-[42rem] rounded-full bg-accent/12 blur-[130px]"
            style={{ animationDelay: '3s' }}
          />
          <div className="grid-bg absolute inset-0 opacity-[0.4]" />
        </div>

        <Sidebar
          active={view}
          onSelect={setView}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((c) => !c)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />

        <div className="relative flex min-w-0 flex-1 flex-col">
          <Topbar
            view={view}
            onOpenMobile={() => setMobileOpen(true)}
            onOpenNotifications={() => setNotifOpen(true)}
            onOpenProfile={() => setView('profile')}
          />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
                <SectionRouter view={view} onNavigate={setView} />
              </motion.div>
            </AnimatePresence>
          </main>
        </div>

        <AiAssistant />
        <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
      </div>
    </ThemeProvider>
  )
}
