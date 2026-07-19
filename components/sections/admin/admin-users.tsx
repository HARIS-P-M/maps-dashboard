'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/dashboard/glass-card'
import { Edit2, Save, Trash2, UserPlus, CheckCircle, RefreshCw } from 'lucide-react'
import { useAuth } from '@/components/dashboard/auth-context'

type Student = {
  id: string
  name: string
  xp: number
  streak: number
  accuracy: number
  prob: number
  role: string
}

const initialStudents: Student[] = [
  { id: '1', name: 'Aarav Mehta', xp: 12840, streak: 62, accuracy: 82, prob: 91, role: 'Student' },
  { id: '2', name: 'Priya Nair', xp: 12110, streak: 48, accuracy: 79, prob: 86, role: 'Student' },
  { id: '3', name: 'Aditya Raj', xp: 11760, streak: 32, accuracy: 78, prob: 74, role: 'Student' },
  { id: '4', name: 'Rohan Das', xp: 11290, streak: 41, accuracy: 74, prob: 68, role: 'Student' },
  { id: '5', name: 'Sana Kapoor', xp: 10870, streak: 29, accuracy: 71, prob: 64, role: 'Student' },
]

export function AdminUsers() {
  const { user, updateStats } = useAuth()
  const [students, setStudents] = useState<Student[]>(() => {
    // Sync Aditya Raj or custom login student to current auth context user stats if logged in
    return initialStudents.map((s) => {
      if (user && s.name.toLowerCase() === 'aditya raj' && user.role === 'user') {
        return {
          ...s,
          name: user.username,
          prob: user.stats.placementProb,
          streak: user.stats.streak,
          accuracy: user.stats.accuracy,
        }
      }
      return s
    })
  })

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editXp, setEditXp] = useState(0)
  const [editStreak, setEditStreak] = useState(0)
  const [editAccuracy, setEditAccuracy] = useState(0)
  const [editProb, setEditProb] = useState(0)
  const [successMsg, setSuccessMsg] = useState('')

  const startEdit = (s: Student) => {
    setEditingId(s.id)
    setEditName(s.name)
    setEditXp(s.xp)
    setEditStreak(s.streak)
    setEditAccuracy(s.accuracy)
    setEditProb(s.prob)
  }

  const handleSave = (id: string) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id === id) {
          // If editing the active student user, sync back to Auth Provider context!
          if (user && user.role === 'user' && s.name === user.username) {
            updateStats({
              placementProb: editProb,
              streak: editStreak,
              accuracy: editAccuracy,
            })
          }
          return {
            ...s,
            name: editName,
            xp: editXp,
            streak: editStreak,
            accuracy: editAccuracy,
            prob: editProb,
          }
        }
        return s
      })
    )
    setEditingId(null)
    setSuccessMsg('Student records updated successfully.')
    setTimeout(() => setSuccessMsg(''), 3000)
  }

  const handleDelete = (id: string) => {
    setStudents((prev) => prev.filter((s) => s.id !== id))
  }

  return (
    <div className="space-y-6">
      {successMsg && (
        <div className="flex items-center gap-2 rounded-xl bg-success/15 border border-success/30 p-4 text-sm text-success">
          <CheckCircle className="size-4" /> {successMsg}
        </div>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Cohort Directory</h2>
          <p className="text-xs text-muted-foreground">Monitor statistics and update placement scores.</p>
        </div>
        <button className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95">
          <UserPlus className="size-4" /> Add Student
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Student Directory Table */}
        <GlassCard className="p-6 xl:col-span-2 overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground pb-2">
                <th className="pb-3 font-semibold">Name</th>
                <th className="pb-3 font-semibold">XP Score</th>
                <th className="pb-3 font-semibold">Streak</th>
                <th className="pb-3 font-semibold">Accuracy</th>
                <th className="pb-3 font-semibold">Placement Prob.</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              {students.map((s) => (
                <tr key={s.id} className="hover:bg-secondary/20">
                  <td className="py-4">
                    {editingId === s.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none"
                      />
                    ) : (
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{s.role}</p>
                      </div>
                    )}
                  </td>
                  <td className="py-4">
                    {editingId === s.id ? (
                      <input
                        type="number"
                        value={editXp}
                        onChange={(e) => setEditXp(Number(e.target.value))}
                        className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none"
                      />
                    ) : (
                      s.xp.toLocaleString()
                    )}
                  </td>
                  <td className="py-4">
                    {editingId === s.id ? (
                      <input
                        type="number"
                        value={editStreak}
                        onChange={(e) => setEditStreak(Number(e.target.value))}
                        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none"
                      />
                    ) : (
                      `${s.streak} days`
                    )}
                  </td>
                  <td className="py-4">
                    {editingId === s.id ? (
                      <input
                        type="number"
                        value={editAccuracy}
                        onChange={(e) => setEditAccuracy(Number(e.target.value))}
                        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none"
                      />
                    ) : (
                      `${s.accuracy}%`
                    )}
                  </td>
                  <td className="py-4">
                    {editingId === s.id ? (
                      <input
                        type="number"
                        value={editProb}
                        onChange={(e) => setEditProb(Number(e.target.value))}
                        className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm outline-none"
                      />
                    ) : (
                      <span className="font-semibold text-primary">{s.prob}%</span>
                    )}
                  </td>
                  <td className="py-4 text-right">
                    {editingId === s.id ? (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => handleSave(s.id)}
                          className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground hover:opacity-90"
                          title="Save Changes"
                        >
                          <Save className="size-4" />
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="grid size-8 place-items-center rounded-lg border border-border hover:bg-secondary"
                          title="Cancel"
                        >
                          <RefreshCw className="size-4" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => startEdit(s)}
                          className="grid size-8 place-items-center rounded-lg border border-border hover:bg-secondary text-muted-foreground hover:text-foreground"
                          title="Edit Student"
                        >
                          <Edit2 className="size-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s.id)}
                          className="grid size-8 place-items-center rounded-lg border border-border hover:bg-destructive/15 text-muted-foreground hover:text-destructive"
                          title="Remove Student"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </GlassCard>

        {/* Inline Info Panel */}
        <GlassCard className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-semibold">Cohort Overview</h3>
            <p className="text-xs text-muted-foreground mt-1">Global aggregates calculated from the active cohort directory.</p>

            <div className="mt-6 space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Class Average Prob.</span>
                <span className="font-semibold">77.0%</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Class Average Accuracy</span>
                <span className="font-semibold">76.8%</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-border/50 pb-2">
                <span className="text-muted-foreground">Top SOLVED Streak</span>
                <span className="font-semibold">62 days</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Enrolled Students</span>
                <span className="font-semibold">{students.length}</span>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-2xl bg-secondary/30 p-4 border border-border">
            <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Admin Advice</h4>
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              Updating student metrics propagates instantly across the dashboard client session. Changes will impact Leaderboard ranks.
            </p>
          </div>
        </GlassCard>
      </div>
    </div>
  )
}
