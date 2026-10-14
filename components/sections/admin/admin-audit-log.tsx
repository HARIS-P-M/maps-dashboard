'use client'

import { useState, useMemo } from 'react'
import { GlassCard } from '@/components/dashboard/glass-card'
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  ShieldOff,
  Trash2,
  Settings,
  UserPlus,
  Edit2,
  Bell,
  ToggleRight,
  Download,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react'

type AuditAction =
  | 'USER_SUSPENDED'
  | 'USER_REACTIVATED'
  | 'USER_DELETED'
  | 'STUDENT_UPDATED'
  | 'STUDENT_ADDED'
  | 'AGENT_CONFIG_CHANGED'
  | 'AGENT_TOGGLED'
  | 'FEATURE_FLAG_CHANGED'
  | 'ANNOUNCEMENT_SENT'
  | 'SECURITY_POLICY_CHANGED'
  | 'PLATFORM_SETTINGS_CHANGED'
  | 'CACHE_CLEARED'

type AuditSeverity = 'low' | 'medium' | 'high'

type AuditEntry = {
  id: string
  timestamp: string
  admin: string
  action: AuditAction
  targetType: 'User' | 'Agent' | 'System' | 'Platform'
  targetId: string
  details: string
  severity: AuditSeverity
  ip: string
}

const ACTION_META: Record<AuditAction, { label: string; icon: React.ElementType; color: string }> = {
  USER_SUSPENDED:            { label: 'User Suspended',         icon: ShieldOff,    color: 'text-destructive' },
  USER_REACTIVATED:          { label: 'User Reactivated',       icon: Shield,       color: 'text-success' },
  USER_DELETED:              { label: 'User Deleted',           icon: Trash2,       color: 'text-destructive' },
  STUDENT_UPDATED:           { label: 'Student Updated',        icon: Edit2,        color: 'text-primary' },
  STUDENT_ADDED:             { label: 'Student Added',          icon: UserPlus,     color: 'text-accent' },
  AGENT_CONFIG_CHANGED:      { label: 'Agent Config Changed',   icon: Settings,     color: 'text-warning' },
  AGENT_TOGGLED:             { label: 'Agent Toggled',          icon: ToggleRight,  color: 'text-chart-4' },
  FEATURE_FLAG_CHANGED:      { label: 'Feature Flag Changed',   icon: ToggleRight,  color: 'text-primary' },
  ANNOUNCEMENT_SENT:         { label: 'Announcement Sent',      icon: Bell,         color: 'text-accent' },
  SECURITY_POLICY_CHANGED:   { label: 'Security Policy',        icon: Shield,       color: 'text-warning' },
  PLATFORM_SETTINGS_CHANGED: { label: 'Platform Settings',      icon: Settings,     color: 'text-muted-foreground' },
  CACHE_CLEARED:             { label: 'Cache Cleared',          icon: AlertCircle,  color: 'text-warning' },
}

const SEVERITY_STYLE: Record<AuditSeverity, string> = {
  low:    'bg-secondary/60 text-muted-foreground',
  medium: 'bg-warning/15 text-warning',
  high:   'bg-destructive/15 text-destructive',
}

const auditLogs: AuditEntry[] = [
  { id: 'al-01', timestamp: '2026-10-14 22:45:11', admin: 'admin',     action: 'USER_SUSPENDED',            targetType: 'User',     targetId: 'meena.i@example.com', details: 'Suspended due to academic integrity policy breach.', severity: 'high',   ip: '192.168.1.10' },
  { id: 'al-02', timestamp: '2026-10-14 21:30:02', admin: 'admin',     action: 'AGENT_CONFIG_CHANGED',      targetType: 'Agent',    targetId: 'coach',               details: 'Temperature changed 0.4 → 0.6; max tokens 1024 → 2048.', severity: 'medium', ip: '192.168.1.10' },
  { id: 'al-03', timestamp: '2026-10-14 20:15:44', admin: 'admin',     action: 'ANNOUNCEMENT_SENT',         targetType: 'Platform', targetId: 'all-students',        details: 'Announced: "Company placement drive next Friday."', severity: 'low',    ip: '192.168.1.10' },
  { id: 'al-04', timestamp: '2026-10-14 19:58:17', admin: 'admin',     action: 'FEATURE_FLAG_CHANGED',      targetType: 'System',   targetId: 'companyInsights',     details: 'Company Insights module enabled.', severity: 'low',    ip: '192.168.1.10' },
  { id: 'al-05', timestamp: '2026-10-14 18:22:05', admin: 'admin',     action: 'STUDENT_UPDATED',           targetType: 'User',     targetId: 'aarav.m@example.com', details: 'XP updated 11940 → 12840; streak 58 → 62.', severity: 'low',    ip: '192.168.1.10' },
  { id: 'al-06', timestamp: '2026-10-14 17:10:33', admin: 'admin',     action: 'AGENT_TOGGLED',             targetType: 'Agent',    targetId: 'aptitude',            details: 'Aptitude Agent set Offline for maintenance window.', severity: 'high',   ip: '192.168.1.10' },
  { id: 'al-07', timestamp: '2026-10-14 16:05:19', admin: 'admin',     action: 'STUDENT_ADDED',             targetType: 'User',     targetId: 'kiran.s@example.com', details: 'New student Kiran Sharma enrolled in CSE 4th year cohort.', severity: 'low',    ip: '192.168.1.10' },
  { id: 'al-08', timestamp: '2026-10-14 14:45:00', admin: 'admin',     action: 'SECURITY_POLICY_CHANGED',   targetType: 'System',   targetId: 'security',            details: 'Session timeout changed 30 → 60 minutes.', severity: 'medium', ip: '192.168.1.10' },
  { id: 'al-09', timestamp: '2026-10-14 13:30:55', admin: 'admin',     action: 'CACHE_CLEARED',             targetType: 'Platform', targetId: 'session-cache',       details: 'All local session caches cleared and re-seeded with demo data.', severity: 'medium', ip: '192.168.1.10' },
  { id: 'al-10', timestamp: '2026-10-14 12:00:10', admin: 'admin',     action: 'USER_REACTIVATED',          targetType: 'User',     targetId: 'rohan.d@example.com', details: 'Student reactivated after suspension appeal.', severity: 'medium', ip: '192.168.1.10' },
  { id: 'al-11', timestamp: '2026-10-13 22:10:44', admin: 'admin',     action: 'PLATFORM_SETTINGS_CHANGED', targetType: 'Platform', targetId: 'platform',            details: 'Max students capacity changed 100 → 200. Registration kept open.', severity: 'low',    ip: '192.168.1.10' },
  { id: 'al-12', timestamp: '2026-10-13 20:05:33', admin: 'admin',     action: 'USER_DELETED',              targetType: 'User',     targetId: 'test.user@example.com', details: 'Test account permanently deleted from cohort.', severity: 'high',   ip: '192.168.1.10' },
  { id: 'al-13', timestamp: '2026-10-13 18:44:22', admin: 'admin',     action: 'AGENT_CONFIG_CHANGED',      targetType: 'Agent',    targetId: 'coding',              details: 'Model changed llama3-8b-8192 → llama3-70b-8192 for better DSA hints.', severity: 'medium', ip: '192.168.1.10' },
  { id: 'al-14', timestamp: '2026-10-13 16:30:08', admin: 'admin',     action: 'FEATURE_FLAG_CHANGED',      targetType: 'System',   targetId: 'aiAssistant',         details: 'ARIA AI Assistant disabled for all students.', severity: 'low',    ip: '192.168.1.10' },
  { id: 'al-15', timestamp: '2026-10-13 14:15:01', admin: 'admin',     action: 'ANNOUNCEMENT_SENT',         targetType: 'Platform', targetId: 'all-students',        details: 'Announced: "System maintenance at 02:00 UTC tonight."', severity: 'low',    ip: '192.168.1.10' },
]

const PAGE_SIZE = 8

export function AdminAuditLog() {
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<'All' | AuditSeverity>('All')
  const [targetFilter, setTargetFilter] = useState<'All' | AuditEntry['targetType']>('All')
  const [page, setPage] = useState(1)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = auditLogs
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(e =>
        e.action.toLowerCase().includes(q) ||
        e.details.toLowerCase().includes(q) ||
        e.targetId.toLowerCase().includes(q) ||
        e.admin.toLowerCase().includes(q)
      )
    }
    if (severityFilter !== 'All') list = list.filter(e => e.severity === severityFilter)
    if (targetFilter !== 'All') list = list.filter(e => e.targetType === targetFilter)
    return list
  }, [search, severityFilter, targetFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selected = auditLogs.find(e => e.id === selectedId)

  const highCount = auditLogs.filter(e => e.severity === 'high').length
  const mediumCount = auditLogs.filter(e => e.severity === 'medium').length
  const lowCount = auditLogs.filter(e => e.severity === 'low').length

  return (
    <div className="space-y-6">

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6">
        <GlassCard className="p-4 xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Total Audit Events</p>
          <p className="text-3xl font-bold">{auditLogs.length}</p>
          <p className="text-xs text-muted-foreground mt-1">last 7 days</p>
        </GlassCard>
        <GlassCard className="p-4 xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-destructive mb-2">High Severity</p>
          <p className="text-3xl font-bold text-destructive">{highCount}</p>
          <p className="text-xs text-muted-foreground mt-1">require review</p>
        </GlassCard>
        <GlassCard className="p-4 xl:col-span-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-warning mb-2">Medium Severity</p>
          <p className="text-3xl font-bold text-warning">{mediumCount}</p>
          <p className="text-xs text-muted-foreground mt-1">informational</p>
        </GlassCard>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by action, target, admin, or details…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="size-4 text-muted-foreground shrink-0" />
          {(['All', 'high', 'medium', 'low'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setSeverityFilter(f); setPage(1) }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-all ${severityFilter === f ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              {f}
            </button>
          ))}
          <span className="text-border/50">|</span>
          {(['All', 'User', 'Agent', 'System', 'Platform'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setTargetFilter(f); setPage(1) }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${targetFilter === f ? 'bg-accent/80 text-accent-foreground' : 'border border-border text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Audit Log Table */}
        <GlassCard className="xl:col-span-2 overflow-x-auto">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border/40">
            <div>
              <h3 className="font-semibold">Audit Trail</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{filtered.length} events found</p>
            </div>
            <button className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary transition-all">
              <Download className="size-3.5" /> Export Log
            </button>
          </div>
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border/40 text-muted-foreground">
                <th className="px-5 py-3 font-semibold">Timestamp</th>
                <th className="px-3 py-3 font-semibold">Action</th>
                <th className="px-3 py-3 font-semibold">Target</th>
                <th className="px-3 py-3 font-semibold">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {paginated.map(entry => {
                const meta = ACTION_META[entry.action]
                const Icon = meta.icon
                return (
                  <tr
                    key={entry.id}
                    onClick={() => setSelectedId(selectedId === entry.id ? null : entry.id)}
                    className={`cursor-pointer transition-colors ${selectedId === entry.id ? 'bg-primary/5' : 'hover:bg-secondary/20'}`}
                  >
                    <td className="px-5 py-3.5">
                      <p className="font-mono text-xs text-muted-foreground">{entry.timestamp.split(' ')[0]}</p>
                      <p className="font-mono text-[10px] text-muted-foreground/60">{entry.timestamp.split(' ')[1]}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <div className="flex items-center gap-2">
                        <Icon className={`size-3.5 shrink-0 ${meta.color}`} />
                        <span className="text-xs font-semibold">{meta.label}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3.5">
                      <p className="text-xs font-semibold">{entry.targetType}</p>
                      <p className="text-[10px] text-muted-foreground truncate max-w-[120px]">{entry.targetId}</p>
                    </td>
                    <td className="px-3 py-3.5">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${SEVERITY_STYLE[entry.severity]}`}>
                        {entry.severity}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-sm text-muted-foreground">No audit events match the current filter.</td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/40">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40"><ChevronLeft className="size-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40"><ChevronRight className="size-4" /></button>
            </div>
          </div>
        </GlassCard>

        {/* Detail Panel */}
        <div className="space-y-4">
          {selected ? (
            <GlassCard className="p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold">Event Detail</h3>
                <button onClick={() => setSelectedId(null)} className="grid size-7 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-secondary">
                  <X className="size-4" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                {(() => {
                  const meta = ACTION_META[selected.action]
                  const Icon = meta.icon
                  return (
                    <div className={`grid size-10 place-items-center rounded-xl bg-secondary/40`}>
                      <Icon className={`size-5 ${meta.color}`} />
                    </div>
                  )
                })()}
                <div>
                  <p className="font-semibold text-sm">{ACTION_META[selected.action].label}</p>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${SEVERITY_STYLE[selected.severity]}`}>
                    {selected.severity} severity
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { label: 'Event ID',    value: selected.id },
                  { label: 'Admin',       value: selected.admin },
                  { label: 'Target Type', value: selected.targetType },
                  { label: 'Target ID',   value: selected.targetId },
                  { label: 'IP Address',  value: selected.ip },
                ].map(item => (
                  <div key={item.label} className="rounded-xl bg-secondary/30 px-3.5 py-3">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">{item.label}</p>
                    <p className="text-xs font-mono font-semibold break-all">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl bg-secondary/30 p-3.5">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">Details</p>
                <p className="text-sm leading-relaxed">{selected.details}</p>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="size-3.5" />
                <span className="font-mono">{selected.timestamp}</span>
              </div>
            </GlassCard>
          ) : (
            <GlassCard className="p-6 text-center space-y-3">
              <div className="grid size-12 place-items-center rounded-2xl bg-secondary/40 mx-auto">
                <Clock className="size-5 text-muted-foreground" />
              </div>
              <p className="font-semibold">No Event Selected</p>
              <p className="text-xs text-muted-foreground">Click any row in the audit trail to view its full details here.</p>
            </GlassCard>
          )}

          <GlassCard className="p-5 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Audit Policy</h4>
            <div className="space-y-2 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle className="size-3.5 text-success shrink-0 mt-0.5" />
                <span>All privileged mutations are automatically recorded.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="size-3.5 text-success shrink-0 mt-0.5" />
                <span>Logs include admin identity, target, and timestamp.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle className="size-3.5 text-success shrink-0 mt-0.5" />
                <span>No secrets or full personal data in audit metadata.</span>
              </div>
              <div className="flex items-start gap-2">
                <AlertCircle className="size-3.5 text-warning shrink-0 mt-0.5" />
                <span>Audit logs must not be manually edited or deleted.</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
