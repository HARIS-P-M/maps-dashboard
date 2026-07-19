'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'

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
  username: string
  role: UserRole
  stats: UserStats
}

type AuthCtx = {
  user: AuthUser | null
  login: (username: string, role: UserRole) => void
  logout: () => void
  updateStats: (stats: Partial<UserStats>) => void
}

const defaultStats: UserStats = {
  placementProb: 74,
  atsScore: 78,
  interviewReadiness: 68,
  streak: 32,
  problemsSolved: 74,
  accuracy: 78,
  mockInterviews: 8,
  activeDays: 32,
}

const Ctx = createContext<AuthCtx>({
  user: null,
  login: () => {},
  logout: () => {},
  updateStats: () => {},
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('maps_auth')
    if (saved) {
      try {
        setUser(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse auth state', e)
      }
    }
    setLoading(false)
  }, [])

  const login = (username: string, role: UserRole) => {
    const freshUser: AuthUser = {
      username: username || (role === 'admin' ? 'Administrator' : 'Student User'),
      role,
      stats: { ...defaultStats },
    }
    setUser(freshUser)
    localStorage.setItem('maps_auth', JSON.stringify(freshUser))
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('maps_auth')
  }

  const updateStats = (newStats: Partial<UserStats>) => {
    setUser((prev) => {
      if (!prev) return null
      const updated = {
        ...prev,
        stats: { ...prev.stats, ...newStats },
      }
      localStorage.setItem('maps_auth', JSON.stringify(updated))
      return updated
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
