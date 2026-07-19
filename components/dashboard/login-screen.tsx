'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, KeyRound, ArrowRight } from 'lucide-react'
import { useAuth, type UserRole } from './auth-context'

export function LoginScreen({ forcedRole }: { forcedRole: UserRole }) {
  const { login } = useAuth()
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const trimmedName = name.trim()
    const trimmedPass = password.trim()

    if (!trimmedName) {
      setError(
        forcedRole === 'user'
          ? 'Please enter a username or display name.'
          : 'Please enter your administrator account identifier.'
      )
      return
    }

    if (!trimmedPass) {
      setError('Please enter a password.')
      return
    }

    if (trimmedPass !== 'password') {
      setError('Incorrect password. (Hint: use "password")')
      return
    }

    setLoading(true)
    setTimeout(() => {
      login(trimmedName, forcedRole)
      setLoading(false)
    }, 600)
  }

  return (
    <div className="relative flex min-h-dvh items-center justify-center p-4">
      {/* Ambient background blur circles */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="animate-aura absolute -left-20 -top-20 size-[32rem] rounded-full bg-primary/10 blur-[100px]" />
        <div
          className="animate-aura absolute -bottom-32 -right-20 size-[36rem] rounded-full bg-accent/10 blur-[110px]"
          style={{ animationDelay: '3s' }}
        />
        <div className="grid-bg absolute inset-0 opacity-[0.25]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="glass glow relative w-full max-w-md overflow-hidden rounded-3xl p-6 sm:p-8"
      >
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center">
          <div className="animate-pulse-ring grid h-14 w-14 place-items-center rounded-2xl bg-primary/15 text-primary">
            <Sparkles className="size-7" />
          </div>
          <h1 className="mt-4 text-2xl font-bold tracking-tight">
            {forcedRole === 'user' ? 'MAPS Prep OS' : 'MAPS Admin Panel'}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {forcedRole === 'user'
              ? 'Multi-Agent Placement Preparation System'
              : 'System Configuration & Cohort Administration'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="username">
                {forcedRole === 'user' ? 'Student Full Name' : 'Administrator Email/Username'}
              </label>
              <input
                id="username"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={forcedRole === 'user' ? 'e.g. Aditya Raj' : 'e.g. admin'}
                className="mt-1.5 w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-secondary/50"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="password">
                Password
              </label>
              <div className="relative mt-1.5">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-muted-foreground/60">
                  <KeyRound className="size-4" />
                </span>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password..."
                  className="w-full rounded-xl border border-border bg-secondary/30 py-2.5 pl-10 pr-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-secondary/50"
                  required
                />
              </div>
              <p className="mt-1.5 text-right font-mono text-[10px] text-muted-foreground">
                Hint: Use <span className="underline font-bold">password</span>
              </p>
            </div>
          </div>

          {error && (
            <p className="text-xs text-destructive">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
          >
            {loading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
            ) : (
              <>
                Authenticate Account
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  )
}
