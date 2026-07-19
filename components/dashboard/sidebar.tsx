'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { PanelLeftClose, PanelLeft, Sparkles, X, LogOut } from 'lucide-react'
import { navItems, adminNavItems, type ViewId } from '@/lib/nav'
import { cn } from '@/lib/utils'
import { useAuth } from './auth-context'

export function Sidebar({
  active,
  onSelect,
  collapsed,
  onToggleCollapse,
  mobileOpen,
  onCloseMobile,
}: {
  active: ViewId
  onSelect: (id: ViewId) => void
  collapsed: boolean
  onToggleCollapse: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  const { user, logout } = useAuth()
  const width = collapsed ? 76 : 264

  const itemsToRender = user?.role === 'admin' ? adminNavItems : navItems
  const activeGroups = user?.role === 'admin'
    ? ['Overview', 'Management', 'Configuration']
    : ['Overview', 'Preparation', 'Intelligence', 'Community', 'Account']

  const nav = (
    <nav aria-label="Primary" className="flex h-full flex-col">
      {/* Brand */}
      <div className="flex h-16 items-center gap-3 px-4">
        <div className="animate-pulse-ring grid size-9 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
          <Sparkles className="size-5" aria-hidden />
        </div>
        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              className="min-w-0"
            >
              <p className="truncate text-sm font-semibold leading-tight">MAPS</p>
              <p className="truncate font-mono text-[0.65rem] uppercase tracking-widest text-muted-foreground">
                {user?.role === 'admin' ? 'Admin Portal' : 'Placement OS'}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={onCloseMobile}
          className="ml-auto grid size-8 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent lg:hidden"
          aria-label="Close menu"
        >
          <X className="size-4" />
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 space-y-5 overflow-y-auto px-3 pb-4 pt-2">
        {activeGroups.map((group) => {
          const items = itemsToRender.filter((i) => i.group === group)
          if (items.length === 0) return null
          return (
            <div key={group}>
              {!collapsed && (
                <p className="mb-1.5 px-3 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground/70">
                  {group}
                </p>
              )}
              <ul className="space-y-1">
                {items.map((item) => {
                  const Icon = item.icon
                  const isActive = active === item.id
                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => {
                          onSelect(item.id)
                          onCloseMobile()
                        }}
                        aria-current={isActive ? 'page' : undefined}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          'group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors',
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                            : 'text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
                          collapsed && 'justify-center',
                        )}
                      >
                        {isActive && (
                          <motion.span
                            layoutId="active-pill"
                            className="absolute inset-y-1 left-0 w-1 rounded-full bg-primary shadow-[0_0_12px_var(--glow)]"
                            transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                          />
                        )}
                        <Icon className={cn('size-[18px] shrink-0', isActive && 'text-primary')} aria-hidden />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                        {!collapsed && item.badge ? (
                          <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary/20 px-1.5 text-[0.65rem] font-semibold text-primary">
                            {item.badge}
                          </span>
                        ) : null}
                        {collapsed && item.badge ? (
                          <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary" />
                        ) : null}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )
        })}
      </div>

      {/* Footer (Logout & Collapse) */}
      <div className="border-t border-sidebar-border p-3 space-y-1">
        <button
          onClick={logout}
          className={cn(
            'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Log Out' : undefined}
        >
          <LogOut className="size-[18px] shrink-0" />
          {!collapsed && <span>Log Out</span>}
        </button>

        <button
          onClick={onToggleCollapse}
          className={cn(
            'hidden w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-sidebar-foreground/75 hover:bg-sidebar-accent/60 transition-colors lg:flex',
            collapsed && 'justify-center'
          )}
        >
          {collapsed ? <PanelLeft className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </nav>
  )

  return (
    <>
      {/* Desktop */}
      <motion.aside
        animate={{ width }}
        transition={{ type: 'spring', stiffness: 300, damping: 34 }}
        className="sticky top-0 hidden h-dvh shrink-0 border-r border-sidebar-border bg-sidebar/80 backdrop-blur-xl lg:block"
      >
        {nav}
      </motion.aside>

      {/* Mobile / tablet drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onCloseMobile}
              className="fixed inset-0 z-40 bg-background/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed inset-y-0 left-0 z-50 w-[264px] border-r border-sidebar-border bg-sidebar lg:hidden"
            >
              {nav}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
