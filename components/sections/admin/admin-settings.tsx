'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/dashboard/glass-card'
import { CheckCircle, Database, Layout, Lock, Sliders, ToggleLeft, ToggleRight } from 'lucide-react'

export function AdminSettings() {
  const [features, setFeatures] = useState({
    mockInterview: true,
    leaderboard: true,
    aptitudeLab: true,
    roadmapGenerator: true,
    advancedAnalytics: true,
  })

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')

  const handleToggle = (key: keyof typeof features) => {
    setFeatures((prev) => ({
      ...prev,
      [key]: !prev[key],
    }))
  }

  const handleSave = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSuccess('Global portal settings saved successfully.')
      setTimeout(() => setSuccess(''), 2500)
    }, 800)
  }

  const handleResetDatabase = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSuccess('Mock database caches cleared and re-seeded.')
      setTimeout(() => setSuccess(''), 2500)
    }, 1200)
  }

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-success/15 border border-success/30 p-4 text-sm text-success">
          <CheckCircle className="size-4" /> {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Toggle Modules */}
        <GlassCard className="p-6">
          <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
            <Layout className="size-4 text-primary" /> Feature Modules
          </h3>
          <p className="text-xs text-muted-foreground mb-6">
            Instantly enable or disable student-facing dashboard components across the platform.
          </p>

          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div>
                <p className="text-sm font-semibold">Mock Interview Lab</p>
                <p className="text-xs text-muted-foreground">Allows recording and speech-to-text assessments.</p>
              </div>
              <button onClick={() => handleToggle('mockInterview')}>
                {features.mockInterview ? <ToggleRight className="size-6 text-primary" /> : <ToggleLeft className="size-6" />}
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div>
                <p className="text-sm font-semibold">Cohort Leaderboard</p>
                <p className="text-xs text-muted-foreground">Display user ranks and XP score comparisons.</p>
              </div>
              <button onClick={() => handleToggle('leaderboard')}>
                {features.leaderboard ? <ToggleRight className="size-6 text-primary" /> : <ToggleLeft className="size-6" />}
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div>
                <p className="text-sm font-semibold">Aptitude Lab Drills</p>
                <p className="text-xs text-muted-foreground">Allows users to attempt quant, logical, and verbal drills.</p>
              </div>
              <button onClick={() => handleToggle('aptitudeLab')}>
                {features.aptitudeLab ? <ToggleRight className="size-6 text-primary" /> : <ToggleLeft className="size-6" />}
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/50">
              <div>
                <p className="text-sm font-semibold">Agent Roadmap Generator</p>
                <p className="text-xs text-muted-foreground">Triggers Coach Agent to re-evaluate roadmaps.</p>
              </div>
              <button onClick={() => handleToggle('roadmapGenerator')}>
                {features.roadmapGenerator ? <ToggleRight className="size-6 text-primary" /> : <ToggleLeft className="size-6" />}
              </button>
            </div>

            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-semibold">Advanced Recharts Analytics</p>
                <p className="text-xs text-muted-foreground">Provides multi-dimensional KPI graphs to students.</p>
              </div>
              <button onClick={() => handleToggle('advancedAnalytics')}>
                {features.advancedAnalytics ? <ToggleRight className="size-6 text-primary" /> : <ToggleLeft className="size-6" />}
              </button>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
            >
              Save Module Configs
            </button>
          </div>
        </GlassCard>

        {/* Database & Security Operations */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
              <Database className="size-4 text-accent" /> Cache & Database Maintenance
            </h3>
            <p className="text-xs text-muted-foreground mb-6">
              Manage system-wide states. Clear localStorage and local caches to reset mocks.
            </p>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-border bg-secondary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Re-seed Application Data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Reset XP levels, streaks, and clear user session edits.</p>
                </div>
                <button
                  onClick={handleResetDatabase}
                  disabled={saving}
                  className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold hover:bg-secondary text-foreground"
                >
                  Clear Caches
                </button>
              </div>

              <div className="p-4 rounded-xl border border-border bg-secondary/20 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Maintenance Window</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Toggle maintenance overlay to block client API connections.</p>
                </div>
                <button className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold hover:bg-secondary text-foreground">
                  Schedule
                </button>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
              <Lock className="size-4 text-warning" /> Security Policy Toggles
            </h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border/50 text-sm">
                <div>
                  <p className="font-semibold">Student Auto-Registration</p>
                  <p className="text-xs text-muted-foreground">Permits students to register custom usernames.</p>
                </div>
                <ToggleRight className="size-6 text-primary" />
              </div>

              <div className="flex justify-between items-center py-2 text-sm">
                <div>
                  <p className="font-semibold">MFA Required for Administrators</p>
                  <p className="text-xs text-muted-foreground">Force auth-code prompts during administrator logins.</p>
                </div>
                <ToggleLeft className="size-6 text-muted-foreground" />
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
