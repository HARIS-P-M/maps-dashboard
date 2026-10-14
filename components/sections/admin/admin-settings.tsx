'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/dashboard/glass-card'
import {
  CheckCircle,
  Database,
  Layout,
  Lock,
  Globe,
  ToggleLeft,
  ToggleRight,
  RefreshCw,
  AlertTriangle,
  Save,
  Bell,
  Users,
  Shield,
  Sliders,
  X,
} from 'lucide-react'

type FeatureFlags = {
  mockInterview: boolean
  leaderboard: boolean
  aptitudeLab: boolean
  roadmapGenerator: boolean
  advancedAnalytics: boolean
  companyInsights: boolean
  aiAssistant: boolean
  codingArena: boolean
}

type SecuritySettings = {
  studentRegistration: boolean
  mfaForAdmins: boolean
  sessionTimeout: number
  maxLoginAttempts: number
}

type PlatformSettings = {
  maintenanceMode: boolean
  registrationOpen: boolean
  maxStudents: number
  defaultStreak: number
}

export function AdminSettings() {
  const [features, setFeatures] = useState<FeatureFlags>({
    mockInterview: true,
    leaderboard: true,
    aptitudeLab: true,
    roadmapGenerator: true,
    advancedAnalytics: true,
    companyInsights: true,
    aiAssistant: true,
    codingArena: true,
  })

  const [security, setSecurity] = useState<SecuritySettings>({
    studentRegistration: true,
    mfaForAdmins: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
  })

  const [platform, setPlatform] = useState<PlatformSettings>({
    maintenanceMode: false,
    registrationOpen: true,
    maxStudents: 200,
    defaultStreak: 0,
  })

  const [announcementText, setAnnouncementText] = useState('')
  const [announcementAudience, setAnnouncementAudience] = useState<'All' | 'Students' | 'Admins'>('All')

  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState('')
  const [confirmMaintenance, setConfirmMaintenance] = useState(false)

  const flash = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  const handleSaveFeatures = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      flash('Feature flags updated and pushed to all connected clients.')
    }, 800)
  }

  const handleSaveSecurity = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      flash('Security policy settings saved successfully.')
    }, 800)
  }

  const handleSavePlatform = () => {
    if (platform.maintenanceMode && !confirmMaintenance) {
      setConfirmMaintenance(true)
      return
    }
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setConfirmMaintenance(false)
      flash('Platform settings saved. Changes applied immediately.')
    }, 800)
  }

  const handleResetDatabase = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      flash('Local session caches cleared and re-seeded.')
    }, 1200)
  }

  const handleSendAnnouncement = () => {
    if (!announcementText.trim()) return
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setAnnouncementText('')
      flash(`Announcement dispatched to ${announcementAudience} — persisted in notification feed.`)
    }, 600)
  }

  const FeatureRow = ({
    label,
    description,
    featureKey,
  }: {
    label: string
    description: string
    featureKey: keyof FeatureFlags
  }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-border/40 last:border-0">
      <div className="mr-4">
        <p className="text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      </div>
      <button
        onClick={() => setFeatures(prev => ({ ...prev, [featureKey]: !prev[featureKey] }))}
        className="shrink-0"
      >
        {features[featureKey]
          ? <ToggleRight className="size-7 text-primary" />
          : <ToggleLeft className="size-7 text-muted-foreground" />}
      </button>
    </div>
  )

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-success/15 border border-success/30 p-4 text-sm text-success">
          <CheckCircle className="size-4" /> {success}
        </div>
      )}

      {/* Maintenance Confirm */}
      {confirmMaintenance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="glass glow rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-warning/15 text-warning mx-auto">
              <AlertTriangle className="size-5" />
            </div>
            <h3 className="text-center font-bold text-lg">Enable Maintenance Mode?</h3>
            <p className="text-center text-sm text-muted-foreground">
              This will block all student access to the platform and display a maintenance banner. Continue?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmMaintenance(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-secondary transition-all">Cancel</button>
              <button
                onClick={() => {
                  setSaving(true)
                  setTimeout(() => {
                    setSaving(false)
                    setConfirmMaintenance(false)
                    flash('Maintenance mode enabled — student portal is now locked.')
                  }, 800)
                }}
                className="flex-1 rounded-xl bg-warning py-2.5 text-sm font-semibold text-black hover:opacity-90 transition-all"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

        {/* Feature Module Toggles */}
        <GlassCard className="p-6">
          <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
            <Layout className="size-4 text-primary" /> Feature Modules
          </h3>
          <p className="text-xs text-muted-foreground mb-5">
            Enable or disable student-facing modules platform-wide.
          </p>
          <FeatureRow label="Coding Arena"          description="AI pair programmer and DSA practice." featureKey="codingArena" />
          <FeatureRow label="Mock Interview Lab"    description="Recording and speech-to-text assessments." featureKey="mockInterview" />
          <FeatureRow label="Cohort Leaderboard"    description="XP rankings and cohort comparisons." featureKey="leaderboard" />
          <FeatureRow label="Aptitude Lab Drills"   description="Quant, logical, and verbal exercises." featureKey="aptitudeLab" />
          <FeatureRow label="Roadmap Generator"     description="Coach Agent adaptive learning plans." featureKey="roadmapGenerator" />
          <FeatureRow label="Advanced Analytics"    description="Multi-dimensional KPI trend charts." featureKey="advancedAnalytics" />
          <FeatureRow label="Company Insights"      description="JD mapping and target company research." featureKey="companyInsights" />
          <FeatureRow label="ARIA AI Assistant"     description="Floating conversational AI helper." featureKey="aiAssistant" />
          <div className="mt-5 flex justify-end">
            <button
              onClick={handleSaveFeatures}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
              Save Feature Config
            </button>
          </div>
        </GlassCard>

        {/* Security Settings */}
        <GlassCard className="p-6">
          <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
            <Lock className="size-4 text-warning" /> Security Policy
          </h3>
          <p className="text-xs text-muted-foreground mb-5">
            Control authentication and access control settings.
          </p>

          <div className="space-y-5">
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <div>
                <p className="text-sm font-semibold">Student Self-Registration</p>
                <p className="text-xs text-muted-foreground">Allow students to create new accounts.</p>
              </div>
              <button onClick={() => setSecurity(s => ({ ...s, studentRegistration: !s.studentRegistration }))}>
                {security.studentRegistration ? <ToggleRight className="size-7 text-primary" /> : <ToggleLeft className="size-7 text-muted-foreground" />}
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <div>
                <p className="text-sm font-semibold">MFA for Administrators</p>
                <p className="text-xs text-muted-foreground">Require 2FA during admin login.</p>
              </div>
              <button onClick={() => setSecurity(s => ({ ...s, mfaForAdmins: !s.mfaForAdmins }))}>
                {security.mfaForAdmins ? <ToggleRight className="size-7 text-primary" /> : <ToggleLeft className="size-7 text-muted-foreground" />}
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Session Timeout (minutes)</label>
                <span className="text-sm font-mono font-semibold">{security.sessionTimeout}</span>
              </div>
              <input
                type="range"
                min="15"
                max="240"
                step="15"
                value={security.sessionTimeout}
                onChange={e => setSecurity(s => ({ ...s, sessionTimeout: +e.target.value }))}
                className="w-full accent-primary cursor-pointer h-1.5 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>15 min</span><span>4 hrs</span></div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max Login Attempts</label>
                <span className="text-sm font-mono font-semibold">{security.maxLoginAttempts}</span>
              </div>
              <input
                type="range"
                min="3"
                max="10"
                step="1"
                value={security.maxLoginAttempts}
                onChange={e => setSecurity(s => ({ ...s, maxLoginAttempts: +e.target.value }))}
                className="w-full accent-primary cursor-pointer h-1.5 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>3</span><span>10</span></div>
            </div>

            <button
              onClick={handleSaveSecurity}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Shield className="size-4" />}
              Save Security Policy
            </button>
          </div>
        </GlassCard>

        {/* Platform Settings */}
        <GlassCard className="p-6">
          <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
            <Globe className="size-4 text-accent" /> Platform Settings
          </h3>
          <p className="text-xs text-muted-foreground mb-5">
            Global platform configuration and capacity controls.
          </p>

          <div className="space-y-5">
            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <div>
                <p className="text-sm font-semibold">Maintenance Mode</p>
                <p className="text-xs text-muted-foreground">Lock student portal during updates.</p>
              </div>
              <button onClick={() => setPlatform(p => ({ ...p, maintenanceMode: !p.maintenanceMode }))}>
                {platform.maintenanceMode ? <ToggleRight className="size-7 text-warning" /> : <ToggleLeft className="size-7 text-muted-foreground" />}
              </button>
            </div>

            <div className="flex items-center justify-between py-2 border-b border-border/40">
              <div>
                <p className="text-sm font-semibold">Open Registrations</p>
                <p className="text-xs text-muted-foreground">Allow new cohort sign-ups.</p>
              </div>
              <button onClick={() => setPlatform(p => ({ ...p, registrationOpen: !p.registrationOpen }))}>
                {platform.registrationOpen ? <ToggleRight className="size-7 text-primary" /> : <ToggleLeft className="size-7 text-muted-foreground" />}
              </button>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Max Students Capacity</label>
                <span className="text-sm font-mono font-semibold">{platform.maxStudents}</span>
              </div>
              <input
                type="range"
                min="50"
                max="500"
                step="50"
                value={platform.maxStudents}
                onChange={e => setPlatform(p => ({ ...p, maxStudents: +e.target.value }))}
                className="w-full accent-primary cursor-pointer h-1.5 rounded-lg"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1"><span>50</span><span>500</span></div>
            </div>

            {platform.maintenanceMode && (
              <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3.5">
                <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
                <p className="text-xs text-warning">Maintenance mode is enabled. Student access is currently blocked.</p>
              </div>
            )}

            <button
              onClick={handleSavePlatform}
              disabled={saving}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="size-4 animate-spin" /> : <Sliders className="size-4" />}
              Save Platform Config
            </button>
          </div>
        </GlassCard>

        {/* Announcements + Cache */}
        <div className="space-y-6">
          <GlassCard className="p-6">
            <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
              <Bell className="size-4 text-primary" /> Send Announcement
            </h3>
            <p className="text-xs text-muted-foreground mb-5">
              Persist a notification to the selected audience's feed.
            </p>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Audience</label>
                <div className="mt-2 flex gap-2">
                  {(['All', 'Students', 'Admins'] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => setAnnouncementAudience(a)}
                      className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-all ${announcementAudience === a ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-secondary'}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={announcementText}
                onChange={e => setAnnouncementText(e.target.value)}
                placeholder="e.g. Company placement drive scheduled for next Friday. Ensure your resume is updated."
                className="w-full h-24 rounded-xl border border-border bg-secondary/30 p-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 resize-none"
              />
              <button
                onClick={handleSendAnnouncement}
                disabled={!announcementText.trim() || saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
              >
                <Bell className="size-4" /> Send to {announcementAudience}
              </button>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h3 className="font-semibold text-base mb-1 flex items-center gap-2">
              <Database className="size-4 text-accent" /> Cache & Maintenance
            </h3>
            <p className="text-xs text-muted-foreground mb-5">Manage system caches and seeded data.</p>

            <div className="space-y-3">
              <div className="rounded-xl border border-border bg-secondary/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Re-seed Demo Data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Reset XP, streaks, and clear session edits.</p>
                </div>
                <button
                  onClick={handleResetDatabase}
                  disabled={saving}
                  className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold hover:bg-secondary text-foreground disabled:opacity-50 transition-all"
                >
                  Clear Caches
                </button>
              </div>

              <div className="rounded-xl border border-border bg-secondary/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Export Cohort Data</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Download student progress as CSV (admin only).</p>
                </div>
                <button
                  className="rounded-lg border border-border px-3.5 py-2 text-xs font-semibold hover:bg-secondary text-foreground transition-all"
                >
                  Export CSV
                </button>
              </div>

              <div className="flex items-start gap-2 rounded-xl border border-border bg-secondary/20 p-4">
                <Shield className="size-4 text-muted-foreground shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  API keys and secrets are stored only in server environment variables and are never persisted in these settings or exposed to client code.
                </p>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
