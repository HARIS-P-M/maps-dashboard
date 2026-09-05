'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Lock, Sparkles } from 'lucide-react'
import { ThemeProvider } from './theme-context'
import { AuthProvider, useAuth } from './auth-context'
import { LoginScreen } from './login-screen'
import { Sidebar } from './sidebar'
import { Topbar } from './topbar'
import { AiAssistant } from './ai-assistant'
import { NotificationsDrawer } from './notifications-drawer'
import { SectionRouter } from '@/components/sections/section-router'
import type { ViewId } from '@/lib/nav'

function DashboardInner({ isAdminRoute = false }: { isAdminRoute?: boolean }) {
  const { user, logout } = useAuth()
  const [view, setView] = useState<ViewId>(isAdminRoute ? 'admin-dashboard' : 'dashboard')
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)

  // Redirect to role-appropriate home view on login/route changes
  useEffect(() => {
    if (user) {
      if (isAdminRoute && user.role === 'admin') {
        setView('admin-dashboard')
      } else if (!isAdminRoute && user.role === 'user') {
        setView('dashboard')
      }
    }
  }, [user, isAdminRoute])

  if (!user) {
    return <LoginScreen forcedRole={isAdminRoute ? 'admin' : 'user'} />
  }

  // Cross-role access control check: Student trying to open Admin Portal
  if (isAdminRoute && user.role !== 'admin') {
    return (
      <div className="relative flex min-h-dvh items-center justify-center p-4">
        {/* Ambient background blur */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="static-aura absolute -left-20 -top-20 size-[32rem] rounded-full bg-destructive/10 blur-[100px]" />
          <div className="grid-bg absolute inset-0 opacity-[0.25]" />
        </div>
        <div className="glass glow relative w-full max-w-md rounded-3xl p-6 text-center space-y-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-destructive/15 text-destructive mx-auto">
            <Lock className="size-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Access Denied</h1>
          <p className="text-sm text-muted-foreground">
            This workspace requires administrative privileges. You are currently logged in as a Student User.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition-all"
            >
              Go to Student Portal
            </a>
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-secondary transition-all"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Cross-role access control check: Admin trying to open Student Portal
  if (!isAdminRoute && user.role === 'admin') {
    return (
      <div className="relative flex min-h-dvh items-center justify-center p-4">
        {/* Ambient background blur */}
        <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="static-aura absolute -left-20 -top-20 size-[32rem] rounded-full bg-primary/10 blur-[100px]" />
          <div className="grid-bg absolute inset-0 opacity-[0.25]" />
        </div>
        <div className="glass glow relative w-full max-w-md rounded-3xl p-6 text-center space-y-6">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary mx-auto">
            <Sparkles className="size-7" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">Admin Console</h1>
          <p className="text-sm text-muted-foreground">
            You are logged in as an Administrator. Continue to the Admin portal or switch accounts.
          </p>
          <div className="flex flex-col gap-3">
            <a
              href="/admin"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition-all"
            >
              Open Admin Portal
            </a>
            <button
              onClick={logout}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-secondary transition-all"
            >
              Log Out
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-dvh bg-background text-foreground">
      {/* Ambient static aura background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="static-aura absolute -left-40 -top-40 size-[38rem] rounded-full bg-primary/12 blur-[120px]" />
        <div
          className="static-aura absolute -bottom-52 -right-40 size-[42rem] rounded-full bg-accent/12 blur-[130px]"
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

      {user.role === 'user' && <AiAssistant />}
      <NotificationsDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </div>
  )
}

export function DashboardShell({ isAdminRoute = false }: { isAdminRoute?: boolean }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DashboardInner isAdminRoute={isAdminRoute} />
      </AuthProvider>
    </ThemeProvider>
  )
}
