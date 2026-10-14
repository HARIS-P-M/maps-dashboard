'use client'

import { useState, useMemo } from 'react'
import { GlassCard } from '@/components/dashboard/glass-card'
import {
  Edit2,
  Save,
  Trash2,
  UserPlus,
  CheckCircle,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
  TrendingUp,
  Code2,
  Brain,
  Video,
  FileText,
  AlertCircle,
  MoreVertical,
  ShieldOff,
  Shield,
  Eye,
} from 'lucide-react'
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'

type StudentStatus = 'Active' | 'Suspended' | 'Inactive'
type Student = {
  id: string
  name: string
  email: string
  branch: string
  year: string
  xp: number
  streak: number
  accuracy: number
  prob: number
  role: 'Student'
  status: StudentStatus
  codingScore: number
  aptitudeScore: number
  interviewScore: number
  resumeScore: number
  activeDays: number
  joinedAt: string
  lastActive: string
  targetRole: string
  targetCompany: string
}

const initialStudents: Student[] = [
  { id: '1', name: 'Aarav Mehta',  email: 'aarav.m@example.com',  branch: 'CSE', year: '4th', xp: 12840, streak: 62, accuracy: 82, prob: 91, role: 'Student', status: 'Active',    codingScore: 88, aptitudeScore: 85, interviewScore: 79, resumeScore: 87, activeDays: 58, joinedAt: '2025-07-01', lastActive: '2 min ago',  targetRole: 'SDE II', targetCompany: 'Google' },
  { id: '2', name: 'Priya Nair',   email: 'priya.n@example.com',  branch: 'IT',  year: '4th', xp: 12110, streak: 48, accuracy: 79, prob: 86, role: 'Student', status: 'Active',    codingScore: 82, aptitudeScore: 80, interviewScore: 74, resumeScore: 91, activeDays: 44, joinedAt: '2025-07-03', lastActive: '15 min ago', targetRole: 'Product',  targetCompany: 'Flipkart' },
  { id: '3', name: 'Aditya Raj',   email: 'aditya.r@example.com', branch: 'CSE', year: '4th', xp: 11760, streak: 32, accuracy: 78, prob: 74, role: 'Student', status: 'Active',    codingScore: 76, aptitudeScore: 74, interviewScore: 68, resumeScore: 72, activeDays: 30, joinedAt: '2025-07-05', lastActive: '1 hr ago',  targetRole: 'SDE I',  targetCompany: 'Amazon' },
  { id: '4', name: 'Rohan Das',    email: 'rohan.d@example.com',  branch: 'ECE', year: '4th', xp: 11290, streak: 41, accuracy: 74, prob: 68, role: 'Student', status: 'Active',    codingScore: 70, aptitudeScore: 72, interviewScore: 65, resumeScore: 68, activeDays: 38, joinedAt: '2025-07-02', lastActive: '3 hr ago',  targetRole: 'SDE I',  targetCompany: 'Microsoft' },
  { id: '5', name: 'Sana Kapoor',  email: 'sana.k@example.com',   branch: 'CSE', year: '3rd', xp: 10870, streak: 29, accuracy: 71, prob: 64, role: 'Student', status: 'Active',    codingScore: 65, aptitudeScore: 70, interviewScore: 60, resumeScore: 63, activeDays: 26, joinedAt: '2025-07-10', lastActive: '5 hr ago',  targetRole: 'SDE I',  targetCompany: 'Infosys' },
  { id: '6', name: 'Kiran Sharma', email: 'kiran.s@example.com',  branch: 'IT',  year: '4th', xp: 9820,  streak: 14, accuracy: 66, prob: 58, role: 'Student', status: 'Inactive',  codingScore: 60, aptitudeScore: 62, interviewScore: 55, resumeScore: 58, activeDays: 12, joinedAt: '2025-07-08', lastActive: '3 days ago', targetRole: 'Analyst', targetCompany: 'TCS' },
  { id: '7', name: 'Meena Iyer',   email: 'meena.i@example.com',  branch: 'CSE', year: '4th', xp: 8940,  streak: 0,  accuracy: 55, prob: 42, role: 'Student', status: 'Suspended', codingScore: 48, aptitudeScore: 50, interviewScore: 40, resumeScore: 45, activeDays: 5,  joinedAt: '2025-07-12', lastActive: '2 wk ago',  targetRole: 'SDE I',  targetCompany: 'Wipro' },
]

const progressHistory = [
  { week: 'W1', coding: 30, aptitude: 25, interview: 20 },
  { week: 'W2', coding: 42, aptitude: 38, interview: 30 },
  { week: 'W3', coding: 58, aptitude: 52, interview: 45 },
  { week: 'W4', coding: 72, aptitude: 65, interview: 58 },
  { week: 'W5', coding: 80, aptitude: 72, interview: 68 },
  { week: 'W6', coding: 88, aptitude: 80, interview: 74 },
]

const PAGE_SIZE = 5

function StatusBadge({ status }: { status: StudentStatus }) {
  const styles: Record<StudentStatus, string> = {
    Active:    'bg-success/15 text-success',
    Suspended: 'bg-destructive/15 text-destructive',
    Inactive:  'bg-muted text-muted-foreground',
  }
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${styles[status]}`}>
      <span className={`size-1.5 rounded-full ${status === 'Active' ? 'bg-success animate-pulse' : status === 'Suspended' ? 'bg-destructive' : 'bg-muted-foreground'}`} />
      {status}
    </span>
  )
}

export function AdminUsers() {
  const [students, setStudents] = useState<Student[]>(initialStudents)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | StudentStatus>('All')
  const [page, setPage] = useState(1)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<Partial<Student>>({})
  const [selectedId, setSelectedId] = useState<string>('1')
  const [successMsg, setSuccessMsg] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const filtered = useMemo(() => {
    let list = students
    if (search.trim()) {
      const q = search.toLowerCase()
      list = list.filter(s =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.branch.toLowerCase().includes(q) ||
        s.targetRole.toLowerCase().includes(q) ||
        s.targetCompany.toLowerCase().includes(q)
      )
    }
    if (statusFilter !== 'All') {
      list = list.filter(s => s.status === statusFilter)
    }
    return list
  }, [students, search, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
  const selected = students.find(s => s.id === selectedId) ?? students[0]

  const startEdit = (s: Student) => {
    setEditingId(s.id)
    setEditFields({ xp: s.xp, streak: s.streak, accuracy: s.accuracy, prob: s.prob, status: s.status })
  }

  const handleSave = (id: string) => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, ...editFields } : s))
    setEditingId(null)
    flash('Student record updated successfully.')
  }

  const handleDelete = (id: string) => {
    setStudents(prev => prev.filter(s => s.id !== id))
    setConfirmDelete(null)
    if (selectedId === id) setSelectedId(students.find(s => s.id !== id)?.id ?? '')
    flash('Student removed from cohort.')
  }

  const toggleSuspend = (id: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id !== id) return s
      const next: StudentStatus = s.status === 'Suspended' ? 'Active' : 'Suspended'
      return { ...s, status: next }
    }))
    flash(students.find(s => s.id === id)?.status === 'Suspended' ? 'Student reactivated.' : 'Student suspended.')
  }

  const flash = (msg: string) => {
    setSuccessMsg(msg)
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const radarData = selected ? [
    { subject: 'Coding',    score: selected.codingScore },
    { subject: 'Aptitude',  score: selected.aptitudeScore },
    { subject: 'Interview', score: selected.interviewScore },
    { subject: 'Resume',    score: selected.resumeScore },
    { subject: 'Streak',    score: Math.min(100, selected.streak * 1.5) },
  ] : []

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-success/15 border border-success/30 p-4 text-sm text-success">
          <CheckCircle className="size-4" /> {successMsg}
        </div>
      )}

      {/* Confirm Delete Dialog */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="glass glow rounded-2xl p-6 w-full max-w-sm mx-4 space-y-4">
            <div className="grid size-12 place-items-center rounded-2xl bg-destructive/15 text-destructive mx-auto">
              <Trash2 className="size-5" />
            </div>
            <h3 className="text-center font-bold text-lg">Remove Student?</h3>
            <p className="text-center text-sm text-muted-foreground">
              This will permanently remove <strong>{students.find(s => s.id === confirmDelete)?.name}</strong> from the cohort. This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-secondary transition-all">Cancel</button>
              <button onClick={() => handleDelete(confirmDelete)} className="flex-1 rounded-xl bg-destructive py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Cohort Directory</h2>
          <p className="text-xs text-muted-foreground">{filtered.length} of {students.length} students shown</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95"
        >
          <UserPlus className="size-4" /> Add Student
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, branch, target role…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1) }}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-secondary/30 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-secondary/50"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="size-4" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-muted-foreground shrink-0" />
          {(['All', 'Active', 'Inactive', 'Suspended'] as const).map(f => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f); setPage(1) }}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${statusFilter === f ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-secondary hover:text-foreground'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Directory Table */}
        <GlassCard className="xl:col-span-2 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="px-5 py-3.5 font-semibold">Student</th>
                <th className="px-3 py-3.5 font-semibold">Branch</th>
                <th className="px-3 py-3.5 font-semibold">XP</th>
                <th className="px-3 py-3.5 font-semibold">Streak</th>
                <th className="px-3 py-3.5 font-semibold">Readiness</th>
                <th className="px-3 py-3.5 font-semibold">Status</th>
                <th className="px-5 py-3.5 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {paginated.map(s => (
                <tr
                  key={s.id}
                  className={`cursor-pointer transition-colors ${selectedId === s.id ? 'bg-primary/5' : 'hover:bg-secondary/20'}`}
                  onClick={() => setSelectedId(s.id)}
                >
                  <td className="px-5 py-4">
                    {editingId === s.id ? (
                      <input
                        type="text"
                        value={editFields.xp ?? s.xp}
                        readOnly
                        className="rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none w-24"
                      />
                    ) : (
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground">{s.email}</p>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4 text-xs text-muted-foreground">{s.branch}/{s.year}</td>
                  <td className="px-3 py-4 font-mono text-xs">
                    {editingId === s.id ? (
                      <input type="number" value={editFields.xp} onChange={e => setEditFields(f => ({ ...f, xp: +e.target.value }))} className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none" />
                    ) : s.xp.toLocaleString()}
                  </td>
                  <td className="px-3 py-4 text-xs">
                    {editingId === s.id ? (
                      <input type="number" value={editFields.streak} onChange={e => setEditFields(f => ({ ...f, streak: +e.target.value }))} className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none" />
                    ) : `${s.streak}d`}
                  </td>
                  <td className="px-3 py-4">
                    {editingId === s.id ? (
                      <input type="number" value={editFields.prob} onChange={e => setEditFields(f => ({ ...f, prob: +e.target.value }))} className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none" />
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full ${s.prob >= 80 ? 'bg-success' : s.prob >= 60 ? 'bg-primary' : 'bg-warning'}`} style={{ width: `${s.prob}%` }} />
                        </div>
                        <span className="text-xs font-semibold">{s.prob}%</span>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4">
                    {editingId === s.id ? (
                      <select value={editFields.status} onChange={e => setEditFields(f => ({ ...f, status: e.target.value as StudentStatus }))} className="rounded-lg border border-border bg-background px-2 py-1 text-xs outline-none">
                        <option>Active</option>
                        <option>Inactive</option>
                        <option>Suspended</option>
                      </select>
                    ) : <StatusBadge status={s.status} />}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {editingId === s.id ? (
                      <div className="flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleSave(s.id)} className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground hover:opacity-90" title="Save"><Save className="size-3.5" /></button>
                        <button onClick={() => setEditingId(null)} className="grid size-8 place-items-center rounded-lg border border-border hover:bg-secondary" title="Cancel"><RefreshCw className="size-3.5" /></button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1.5" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setSelectedId(s.id)} className="grid size-8 place-items-center rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground" title="View Profile"><Eye className="size-3.5" /></button>
                        <button onClick={() => startEdit(s)} className="grid size-8 place-items-center rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground" title="Edit"><Edit2 className="size-3.5" /></button>
                        <button onClick={() => toggleSuspend(s.id)} className={`grid size-8 place-items-center rounded-lg border border-border transition-colors ${s.status === 'Suspended' ? 'hover:bg-success/15 text-destructive hover:text-success' : 'hover:bg-warning/15 text-muted-foreground hover:text-warning'}`} title={s.status === 'Suspended' ? 'Reactivate' : 'Suspend'}>{s.status === 'Suspended' ? <Shield className="size-3.5" /> : <ShieldOff className="size-3.5" />}</button>
                        <button onClick={() => setConfirmDelete(s.id)} className="grid size-8 place-items-center rounded-lg border border-border hover:bg-destructive/15 text-muted-foreground hover:text-destructive" title="Remove"><Trash2 className="size-3.5" /></button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {paginated.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-sm text-muted-foreground">No students match the current filter.</td>
                </tr>
              )}
            </tbody>
          </table>
          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/50">
            <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex gap-1.5">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40"><ChevronLeft className="size-4" /></button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="grid size-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-secondary disabled:opacity-40"><ChevronRight className="size-4" /></button>
            </div>
          </div>
        </GlassCard>

        {/* Student Detail Panel */}
        {selected && (
          <GlassCard className="p-5 space-y-5">
            <div className="flex items-center gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/15 text-primary font-bold text-sm">
                {selected.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="min-w-0">
                <p className="font-semibold truncate">{selected.name}</p>
                <p className="text-xs text-muted-foreground truncate">{selected.email}</p>
              </div>
              <StatusBadge status={selected.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              {[
                { label: 'Branch',    value: `${selected.branch} • ${selected.year}` },
                { label: 'Target',    value: `${selected.targetRole} @ ${selected.targetCompany}` },
                { label: 'Joined',    value: selected.joinedAt },
                { label: 'Last Seen', value: selected.lastActive },
                { label: 'XP Score',  value: selected.xp.toLocaleString() },
                { label: 'Active Days', value: `${selected.activeDays} days` },
              ].map(item => (
                <div key={item.label} className="rounded-xl bg-secondary/30 p-3">
                  <p className="text-muted-foreground text-[10px] uppercase tracking-wider mb-0.5">{item.label}</p>
                  <p className="font-semibold truncate">{item.value}</p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Skill Radar</p>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="var(--border)" />
                    <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
                    <Radar name="Score" dataKey="score" stroke="var(--primary)" fill="var(--primary)" fillOpacity={0.2} strokeWidth={2} />
                    <Tooltip
                      contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 11 }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-2.5">
              {[
                { label: 'Coding',    score: selected.codingScore,    icon: Code2 },
                { label: 'Aptitude',  score: selected.aptitudeScore,  icon: Brain },
                { label: 'Interview', score: selected.interviewScore, icon: Video },
                { label: 'Resume',    score: selected.resumeScore,    icon: FileText },
              ].map(m => {
                const Icon = m.icon
                return (
                  <div key={m.label} className="flex items-center gap-3">
                    <Icon className="size-3.5 text-muted-foreground shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                        <span>{m.label}</span>
                        <span className="font-semibold">{m.score}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${m.score >= 80 ? 'bg-success' : m.score >= 65 ? 'bg-primary' : 'bg-warning'}`} style={{ width: `${m.score}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">Progress Trend (6 weeks)</p>
              <div className="h-28">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={progressHistory} margin={{ left: -30, right: 4, top: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="week" tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 9, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 10 }} />
                    <Line type="monotone" dataKey="coding" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="aptitude" stroke="var(--chart-2)" strokeWidth={1.5} dot={false} />
                    <Line type="monotone" dataKey="interview" stroke="var(--chart-4)" strokeWidth={1.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </GlassCard>
        )}
      </div>

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm">
          <div className="glass glow rounded-2xl p-6 w-full max-w-md mx-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg">Add New Student</h3>
              <button onClick={() => setShowAddModal(false)} className="grid size-8 place-items-center rounded-lg border border-border hover:bg-secondary">
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Full Name</label>
                <input type="text" placeholder="e.g. Rahul Verma" className="mt-1.5 w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/50" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Email</label>
                <input type="email" placeholder="e.g. rahul@example.com" className="mt-1.5 w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/50" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Branch</label>
                  <select className="mt-1.5 w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none">
                    <option>CSE</option><option>IT</option><option>ECE</option><option>EEE</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Year</label>
                  <select className="mt-1.5 w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none">
                    <option>3rd</option><option>4th</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowAddModal(false)} className="flex-1 rounded-xl border border-border py-2.5 text-sm font-semibold hover:bg-secondary transition-all">Cancel</button>
              <button onClick={() => { setShowAddModal(false); flash('New student added to cohort.') }} className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-95 transition-all">Add Student</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
