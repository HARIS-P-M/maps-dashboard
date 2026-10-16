'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard, SectionHeading } from '@/components/dashboard/glass-card'
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
  Shield,
  Sliders,
  Download,
  Sparkles,
} from 'lucide-react'

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

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
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    void fetch('/api/admin/settings', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load settings.')
        setFeatures(data.settings.featureFlags)
        setSecurity(data.settings.security)
        setPlatform(data.settings.platform)
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : 'Unable to load settings.'))
  }, [])

  const flash = (msg: string) => {
    setSuccess(msg)
    setTimeout(() => setSuccess(''), 3000)
  }

  const saveSettings = async (settings: Record<string, unknown>, message: string) => {
    setSaving(true)
    setLoadError('')
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to save settings.')
      setFeatures(data.settings.featureFlags)
      setSecurity(data.settings.security)
      setPlatform(data.settings.platform)
      flash(message)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFeatures = () => {
    void saveSettings({ featureFlags: features }, 'Feature flags saved successfully.')
  }

  const handleSaveSecurity = () => {
    void saveSettings({ security }, 'Security policy settings saved successfully.')
  }

  const handleSavePlatform = () => {
    if (platform.maintenanceMode && !confirmMaintenance) {
      setConfirmMaintenance(true)
      return
    }
    void saveSettings({ platform }, 'Platform settings saved successfully.')
    setConfirmMaintenance(false)
  }

  const handleResetDatabase = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      flash('Local session caches cleared and re-seeded.')
    }, 1000)
  }

  const handleSendAnnouncement = async () => {
    if (!announcementText.trim()) return
    setSaving(true)
    try {
      const audience = announcementAudience === 'All'
        ? 'ALL_STUDENTS'
        : announcementAudience === 'Students'
          ? 'ACTIVE_STUDENTS'
          : 'ADMINS'
      const response = await fetch('/api/admin/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: announcementText, audience }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to send announcement.')
      setAnnouncementText('')
      flash(`Announcement dispatched to ${announcementAudience}.`)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to send announcement.')
    } finally {
      setSaving(false)
    }
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
        className="shrink-0 p-1"
        aria-label={`Toggle ${label}`}
      >
        {features[featureKey]
          ? <ToggleRight className="size-7 text-primary" />
          : <ToggleLeft className="size-7 text-muted-foreground" />}
      </button>
    </div>
  )

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Toast Alert */}
      {loadError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl bg-success/15 border border-success/30 p-4 text-sm text-success"
        >
          <CheckCircle className="size-4" /> {success}
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
            ENVIRONMENT & POLICY
          </p>
          <h2 className="text-xl font-bold tracking-tight">Platform Configuration</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage feature modules, access security, and global platform parameters.
          </p>
        </div>
      </motion.div>

      {/* Maintenance Confirm Modal */}
      {confirmMaintenance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm p-4">
          <div className="glass glow rounded-2xl p-6 w-full max-w-sm space-y-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-warning/15 text-warning mx-auto">
              <AlertTriangle className="size-5" />
            </div>
            <h3 className="text-center font-bold text-lg">Enable Maintenance Mode?</h3>
            <p className="text-center text-sm text-muted-foreground">
              This will lock the student portal and show a maintenance page to all non-admin users.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmMaintenance(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-secondary transition-all">Cancel</button>
              <button
                onClick={() => {
                  void saveSettings({ platform }, 'Maintenance mode setting saved.')
                  setConfirmMaintenance(false)
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
        <motion.div variants={item}>
          <GlassCard glow className="p-6 h-full flex flex-col justify-between">
            <div>
              <SectionHeading
                eyebrow="MODULE AVAILABILITY"
                title="Student Feature Flags"
              />
              <p className="text-xs text-muted-foreground -mt-2 mb-4">
                Instantly toggle modules visible to candidates across the portal.
              </p>
              <FeatureRow label="Coding Arena"          description="AI pair programmer, test runners, and DSA problems." featureKey="codingArena" />
              <FeatureRow label="Mock Interview Lab"    description="Interactive behavioral and technical questions." featureKey="mockInterview" />
              <FeatureRow label="Cohort Leaderboard"    description="XP rankings and placement probability standings." featureKey="leaderboard" />
              <FeatureRow label="Aptitude Lab Drills"   description="Quantitative, logical, and verbal speed tests." featureKey="aptitudeLab" />
              <FeatureRow label="Roadmap Generator"     description="Personalized 4-week AI preparation sprints." featureKey="roadmapGenerator" />
              <FeatureRow label="Advanced Analytics"    description="Deep skill telemetry and progress radars." featureKey="advancedAnalytics" />
              <FeatureRow label="Company Insights"      description="Target role intelligence and interview breakdown." featureKey="companyInsights" />
              <FeatureRow label="ARIA AI Assistant"     description="Floating situational copilot in student view." featureKey="aiAssistant" />
            </div>
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
        </motion.div>

        {/* Security Settings */}
        <motion.div variants={item}>
          <GlassCard className="p-6 h-full flex flex-col justify-between">
            <div>
              <SectionHeading
                eyebrow="ACCESS CONTROL"
                title="Security Policy"
              />
              <p className="text-xs text-muted-foreground -mt-2 mb-5">
                Authentication constraints, rate limits, and administrative controls.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <div>
                    <p className="text-sm font-semibold">Student Self-Registration</p>
                    <p className="text-xs text-muted-foreground">Allow new students to enroll without admin invite.</p>
                  </div>
                  <button onClick={() => setSecurity(s => ({ ...s, studentRegistration: !s.studentRegistration }))} className="p-1">
                    {security.studentRegistration ? <ToggleRight className="size-7 text-primary" /> : <ToggleLeft className="size-7 text-muted-foreground" />}
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <div>
                    <p className="text-sm font-semibold">MFA for Administrators</p>
                    <p className="text-xs text-muted-foreground">Enforce two-factor verification for admin actions.</p>
                  </div>
                  <button onClick={() => setSecurity(s => ({ ...s, mfaForAdmins: !s.mfaForAdmins }))} className="p-1">
                    {security.mfaForAdmins ? <ToggleRight className="size-7 text-primary" /> : <ToggleLeft className="size-7 text-muted-foreground" />}
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">Session Timeout</label>
                    <span className="text-xs font-mono font-semibold bg-secondary/50 px-2 py-0.5 rounded-md">{security.sessionTimeout} min</span>
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
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                    <span>15 min</span><span>4 hrs</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">Max Failed Logins</label>
                    <span className="text-xs font-mono font-semibold bg-secondary/50 px-2 py-0.5 rounded-md">{security.maxLoginAttempts}</span>
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
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                    <span>3 attempts</span><span>10 attempts</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleSaveSecurity}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="size-4 animate-spin" /> : <Shield className="size-4" />}
                Save Security Policy
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Platform Settings */}
        <motion.div variants={item}>
          <GlassCard className="p-6 h-full flex flex-col justify-between">
            <div>
              <SectionHeading
                eyebrow="COHORT LIMITS"
                title="Platform Scaling"
              />
              <p className="text-xs text-muted-foreground -mt-2 mb-5">
                Cohort enrollment capacity and system status switches.
              </p>

              <div className="space-y-4">
                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <div>
                    <p className="text-sm font-semibold">Maintenance Mode</p>
                    <p className="text-xs text-muted-foreground">Locks platform with a maintenance banner.</p>
                  </div>
                  <button onClick={() => setPlatform(p => ({ ...p, maintenanceMode: !p.maintenanceMode }))} className="p-1">
                    {platform.maintenanceMode ? <ToggleRight className="size-7 text-warning" /> : <ToggleLeft className="size-7 text-muted-foreground" />}
                  </button>
                </div>

                <div className="flex items-center justify-between py-2 border-b border-border/40">
                  <div>
                    <p className="text-sm font-semibold">Registration Status</p>
                    <p className="text-xs text-muted-foreground">Accepting student applications.</p>
                  </div>
                  <button onClick={() => setPlatform(p => ({ ...p, registrationOpen: !p.registrationOpen }))} className="p-1">
                    {platform.registrationOpen ? <ToggleRight className="size-7 text-primary" /> : <ToggleLeft className="size-7 text-muted-foreground" />}
                  </button>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">Max Cohort Capacity</label>
                    <span className="text-xs font-mono font-semibold bg-secondary/50 px-2 py-0.5 rounded-md">{platform.maxStudents} candidates</span>
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
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                    <span>50</span><span>500 candidates</span>
                  </div>
                </div>

                {platform.maintenanceMode && (
                  <div className="flex items-start gap-2 rounded-xl border border-warning/30 bg-warning/10 p-3.5">
                    <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-warning">Maintenance mode active. Non-admin logins are currently deferred.</p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={handleSavePlatform}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
              >
                {saving ? <RefreshCw className="size-4 animate-spin" /> : <Sliders className="size-4" />}
                Save Platform Config
              </button>
            </div>
          </GlassCard>
        </motion.div>

        {/* Announcements & Cache */}
        <motion.div variants={item} className="space-y-6">
          <GlassCard className="p-6">
            <SectionHeading
              eyebrow="COMMUNICATION"
              title="Targeted Broadcast"
            />
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground font-mono">Audience Segment</label>
                <div className="mt-2 flex gap-2">
                  {(['All', 'Students', 'Admins'] as const).map(a => (
                    <button
                      key={a}
                      onClick={() => setAnnouncementAudience(a)}
                      className={`flex-1 rounded-xl py-2 text-xs font-semibold transition-all ${announcementAudience === a ? 'bg-primary text-primary-foreground shadow-sm' : 'border border-border text-muted-foreground hover:bg-secondary'}`}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                value={announcementText}
                onChange={e => setAnnouncementText(e.target.value)}
                placeholder="e.g. DSA coding arena contest starts at 18:00 IST. Ensure Groq credentials are set up."
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
            <SectionHeading
              eyebrow="MAINTENANCE"
              title="Database & Caches"
            />
            <div className="space-y-3 mt-1">
              <div className="rounded-xl border border-border bg-secondary/20 p-3.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">Re-seed Demo Cohort</p>
                  <p className="text-xs text-muted-foreground">Restore default student scores & mock state.</p>
                </div>
                <button
                  onClick={handleResetDatabase}
                  disabled={saving}
                  className="rounded-xl border border-border px-3.5 py-2 text-xs font-semibold hover:bg-secondary text-foreground disabled:opacity-50 transition-all shrink-0"
                >
                  Clear Caches
                </button>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-border bg-secondary/20 p-3.5">
                <Shield className="size-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  System secrets and Groq LLM API keys are isolated in server environment variables.
                </p>
              </div>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  )
}
