'use client'

import { Menu, Search, Bell, Moon, Sun, Command } from 'lucide-react'
import { useTheme } from './theme-context'
import { viewMeta, type ViewId } from '@/lib/nav'

export function Topbar({
  view,
  onOpenMobile,
  onOpenNotifications,
  onOpenProfile,
}: {
  view: ViewId
  onOpenMobile: () => void
  onOpenNotifications: () => void
  onOpenProfile: () => void
}) {
  const { theme, toggle } = useTheme()
  const meta = viewMeta[view]

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/70 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <button
          onClick={onOpenMobile}
          className="grid size-9 place-items-center rounded-lg text-muted-foreground hover:bg-secondary lg:hidden"
          aria-label="Open menu"
        >
          <Menu className="size-5" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold leading-tight sm:text-lg">{meta.title}</h1>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">{meta.subtitle}</p>
        </div>

        {/* Search */}
        <div className="ml-auto hidden items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-sm text-muted-foreground md:flex">
          <Search className="size-4" />
          <input
            aria-label="Search"
            placeholder="Search agents, problems, companies…"
            className="w-48 bg-transparent outline-none placeholder:text-muted-foreground/70 lg:w-64"
          />
          <kbd className="flex items-center gap-0.5 rounded-md border border-border px-1.5 py-0.5 font-mono text-[0.65rem]">
            <Command className="size-3" />K
          </kbd>
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:ml-0">
          <button
            onClick={toggle}
            className="grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
          </button>
          <button
            onClick={onOpenNotifications}
            className="relative grid size-9 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            aria-label="Notifications"
          >
            <Bell className="size-[18px]" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-primary ring-2 ring-background" />
          </button>
          <button
            onClick={onOpenProfile}
            className="ml-1 flex items-center gap-2 rounded-full border border-border bg-secondary/50 py-1 pl-1 pr-3 transition-colors hover:bg-secondary"
            aria-label="Open profile"
          >
            <span className="grid size-7 place-items-center rounded-full bg-primary/20 font-mono text-xs font-semibold text-primary">
              AK
            </span>
            <span className="hidden text-sm font-medium sm:block">Ananya K.</span>
          </button>
        </div>
      </div>
    </header>
  )
}
