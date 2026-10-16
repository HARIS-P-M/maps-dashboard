'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase/client'

export type UserRole = 'user' | 'admin'

export type UserStats = {
  placementProb: number
  atsScore: number
  interviewReadiness: number
  streak: number
  problemsSolved: number
  accuracy: number
  mockInterviews: number
  activeDays: number
}

export type AuthUser = {
  id: string
  email: string
  username: string
  role: UserRole
  stats: UserStats
}

type AuthCtx = {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<string | null>
  logout: () => void
  updateStats: (stats: Partial<UserStats>) => void
}

const defaultStats: UserStats = {
  placementProb: 0,
  atsScore: 0,
  interviewReadiness: 0,
  streak: 0,
  problemsSolved: 0,
  accuracy: 0,
  mockInterviews: 0,
  activeDays: 0,
}

const Ctx = createContext<AuthCtx>({
  user: null,
  login: async () => 'Authentication is unavailable.',
  logout: () => undefined,
  updateStats: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const loadUser = async () => {
      const response = await fetch('/api/me', { cache: 'no-store' })
      if (!active) return
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    void loadUser()
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') return
      void loadUser()
    })

    return () => {
      active = false
      data.subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return error.message

    const response = await fetch('/api/me', { cache: 'no-store' })
    if (!response.ok) {
      await supabase.auth.signOut()
      return 'Your account profile is not available.'
    }
    const data = await response.json()
    setUser(data.user)
    return null
  }

  const logout = async () => {
    await supabase.auth.signOut()
    setUser(null)
  }

  const updateStats = (newStats: Partial<UserStats>) => {
    setUser((prev) => {
      if (!prev) return null
      return { ...prev, stats: { ...prev.stats, ...newStats } }
    })
  }

  if (loading) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Initializing MAPS...</p>
        </div>
      </div>
    )
  }

  return (
    <Ctx.Provider value={{ user, login, logout, updateStats }}>
      {children}
    </Ctx.Provider>
  )
}

export const useAuth = () => useContext(Ctx)
