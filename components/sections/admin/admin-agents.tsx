'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/dashboard/glass-card'
import {
  Save,
  ToggleLeft,
  ToggleRight,
  Settings,
  AlertCircle,
  CheckCircle,
  Activity,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  RefreshCw,
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'

type AgentStatus = 'Online' | 'Offline' | 'Maintenance'

type Agent = {
  id: string
  name: string
  role: string
  status: AgentStatus
  model: string
  temp: number
  maxTokens: number
  load: number
  avgLatency: number
  callsToday: number
  errorsToday: number
  successRate: number
}

const latencyHistory = [
  { time: '09:00', orchestrator: 38, resume: 62, coding: 78, interview: 41, company: 55, coach: 48 },
  { time: '10:00', orchestrator: 42, resume: 58, coding: 85, interview: 38, company: 60, coach: 210 },
  { time: '11:00', orchestrator: 35, resume: 65, coding: 72, interview: 44, company: 52, coach: 155 },
  { time: '12:00', orchestrator: 50, resume: 70, coding: 90, interview: 48, company: 58, coach: 88 },
  { time: '13:00', orchestrator: 38, resume: 63, coding: 80, interview: 40, company: 54, coach: 62 },
  { time: '14:00', orchestrator: 44, resume: 60, coding: 76, interview: 42, company: 57, coach: 75 },
]

const callsByAgent = [
  { name: 'Coding',    calls: 98 },
  { name: 'Resume',    calls: 74 },
  { name: 'Aptitude',  calls: 61 },
  { name: 'Company',   calls: 52 },
  { name: 'Coach',     calls: 38 },
  { name: 'Interview', calls: 24 },
]

const initialAgents: Agent[] = [
  { id: 'orchestrator', name: 'Orchestrator',    role: 'Coordinates all sub-agents',          status: 'Online',  model: 'llama-3.3-70b-versatile', temp: 0.2, maxTokens: 1024, load: 34, avgLatency: 42,  callsToday: 347, errorsToday: 2,  successRate: 99.4 },
  { id: 'resume',       name: 'Resume Agent',    role: 'ATS scoring & keyword matching',      status: 'Online',  model: 'llama-3.3-70b-versatile', temp: 0.5, maxTokens: 2048, load: 58, avgLatency: 63,  callsToday: 74,  errorsToday: 1,  successRate: 98.6 },
  { id: 'coding',       name: 'Coding Agent',    role: 'DSA hints & compiler feedback',       status: 'Online',  model: 'llama3-70b-8192',         temp: 0.3, maxTokens: 4096, load: 72, avgLatency: 80,  callsToday: 98,  errorsToday: 3,  successRate: 96.9 },
  { id: 'interview',    name: 'Interview Agent', role: 'Behavioral speech & text assessment', status: 'Online',  model: 'llama3-70b-8192',         temp: 0.7, maxTokens: 2048, load: 12, avgLatency: 41,  callsToday: 24,  errorsToday: 0,  successRate: 100 },
  { id: 'company',      name: 'Company Agent',   role: 'JD mapping & interview windows',      status: 'Online',  model: 'llama-3.3-70b-versatile', temp: 0.4, maxTokens: 1536, load: 41, avgLatency: 55,  callsToday: 52,  errorsToday: 1,  successRate: 98.1 },
  { id: 'coach',        name: 'Coach Agent',     role: 'Learning plans & activity nudges',    status: 'Online',  model: 'llama-3.3-70b-versatile', temp: 0.6, maxTokens: 2048, load: 27, avgLatency: 106, callsToday: 38,  errorsToday: 4,  successRate: 89.5 },
]

const availableModels = [
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'mixtral-8x7b-32768',
  'gemma2-9b-it',
]

export function AdminAgents() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents)
  const [selectedId, setSelectedId] = useState('orchestrator')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)

  const active = agents.find(a => a.id === selectedId) ?? agents[0]

  const update = (fields: Partial<Agent>) => {
    setAgents(prev => prev.map(a => a.id === selectedId ? { ...a, ...fields } : a))
  }

  const saveSettings = () => {
    setSaving(true)
    setTimeout(() => {
      setSaving(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    }, 800)
  }

  const toggleStatus = (id: string) => {
    setAgents(prev => prev.map(a => {
      if (a.id !== id) return a
      const next: AgentStatus = a.status === 'Online' ? 'Offline' : 'Online'
      return { ...a, status: next, load: next === 'Online' ? a.load : 0 }
    }))
  }

  const totalCalls = agents.reduce((s, a) => s + a.callsToday, 0)
  const totalErrors = agents.reduce((s, a) => s + a.errorsToday, 0)
  const avgSuccess = agents.reduce((s, a) => s + a.successRate, 0) / agents.length

  return (
    <div className="space-y-6">
      {success && (
        <div className="flex items-center gap-2 rounded-xl bg-success/15 border border-success/30 p-4 text-sm text-success">
          <CheckCircle className="size-4" /> Agent configuration saved successfully.
        </div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Calls</span>
            <Activity className="size-4 text-primary" />
          </div>
          <p className="text-2xl font-bold">{totalCalls.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground mt-1">across all agents today</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg Success</span>
            <TrendingUp className="size-4 text-success" />
          </div>
          <p className="text-2xl font-bold">{avgSuccess.toFixed(1)}%</p>
          <p className="text-xs text-muted-foreground mt-1">across all agents</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Errors</span>
            <TrendingDown className="size-4 text-destructive" />
          </div>
          <p className="text-2xl font-bold">{totalErrors}</p>
          <p className="text-xs text-muted-foreground mt-1">{((totalErrors / totalCalls) * 100).toFixed(1)}% error rate</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between text-muted-foreground mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Online Agents</span>
            <Zap className="size-4 text-accent" />
          </div>
          <p className="text-2xl font-bold">{agents.filter(a => a.status === 'Online').length} / {agents.length}</p>
          <p className="text-xs text-muted-foreground mt-1">all agents monitored</p>
        </GlassCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-1">Agent Latency Over Time</h3>
          <p className="text-xs text-muted-foreground mb-4">Average response time (ms) per agent</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyHistory} margin={{ left: -20, right: 6, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 11 }} />
                <Line type="monotone" dataKey="orchestrator" name="Orchestrator" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="coding" name="Coding" stroke="var(--chart-2)" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="coach" name="Coach" stroke="var(--chart-5)" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
                <Line type="monotone" dataKey="resume" name="Resume" stroke="var(--chart-3)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-semibold mb-1">Calls by Agent (Today)</h3>
          <p className="text-xs text-muted-foreground mb-4">Number of AI inference requests per agent</p>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={callsByAgent} layout="vertical" margin={{ left: 8, right: 24, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={60} />
                <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 11 }} />
                <Bar dataKey="calls" name="Calls" fill="var(--primary)" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Agent Grid + Config Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Agent Cards */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Agent Command Center</h3>
            <p className="text-xs text-muted-foreground">Click a card to configure</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {agents.map(a => (
              <GlassCard
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`p-5 cursor-pointer border transition-all ${selectedId === a.id ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20' : 'hover:border-border/80'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm">{a.name}</h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.role}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${a.status === 'Online' ? 'bg-success/15 text-success' : a.status === 'Offline' ? 'bg-muted text-muted-foreground' : 'bg-warning/15 text-warning'}`}>
                    <span className={`size-1.5 rounded-full ${a.status === 'Online' ? 'bg-success animate-pulse' : a.status === 'Offline' ? 'bg-muted-foreground' : 'bg-warning'}`} />
                    {a.status}
                  </span>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-secondary/40 p-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Calls</p>
                    <p className="text-sm font-bold mt-0.5">{a.callsToday}</p>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Latency</p>
                    <p className="text-sm font-bold mt-0.5">{a.avgLatency}ms</p>
                  </div>
                  <div className="rounded-lg bg-secondary/40 p-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Success</p>
                    <p className={`text-sm font-bold mt-0.5 ${a.successRate >= 98 ? 'text-success' : a.successRate >= 90 ? 'text-warning' : 'text-destructive'}`}>{a.successRate}%</p>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Model</p>
                    <p className="text-xs font-mono">{a.model.split('-').slice(0, 2).join('-')}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleStatus(a.id) }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={a.status === 'Online' ? 'Disable Agent' : 'Enable Agent'}
                  >
                    {a.status === 'Online' ? <ToggleRight className="size-6 text-primary" /> : <ToggleLeft className="size-6" />}
                  </button>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1 uppercase tracking-wider">
                    <span>Thread Load</span>
                    <span>{a.load}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${a.load > 70 ? 'bg-destructive' : a.load > 40 ? 'bg-warning' : 'bg-primary'}`}
                      style={{ width: `${a.load}%` }}
                    />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Configuration Panel */}
        <div className="space-y-4">
          <GlassCard className="p-6">
            <h3 className="font-semibold mb-5 flex items-center gap-2">
              <Settings className="size-4 text-primary" /> Configure: {active.name}
            </h3>
            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="agentStatus">
                  Operation Status
                </label>
                <select
                  id="agentStatus"
                  value={active.status}
                  onChange={e => update({ status: e.target.value as AgentStatus })}
                  className="mt-2 w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/50"
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="agentModel">
                  LLM Model
                </label>
                <select
                  id="agentModel"
                  value={active.model}
                  onChange={e => update({ model: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/50"
                >
                  {availableModels.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="agentTemp">
                    Temperature
                  </label>
                  <span className="text-xs font-mono font-semibold">{active.temp.toFixed(1)}</span>
                </div>
                <input
                  id="agentTemp"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={active.temp}
                  onChange={e => update({ temp: +e.target.value })}
                  className="mt-2 w-full accent-primary cursor-pointer h-1.5 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>Precise</span>
                  <span>Creative</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="agentTokens">
                    Max Output Tokens
                  </label>
                  <span className="text-xs font-mono font-semibold">{active.maxTokens.toLocaleString()}</span>
                </div>
                <input
                  id="agentTokens"
                  type="range"
                  min="256"
                  max="8192"
                  step="256"
                  value={active.maxTokens}
                  onChange={e => update({ maxTokens: +e.target.value })}
                  className="mt-2 w-full accent-primary cursor-pointer h-1.5 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                  <span>256</span>
                  <span>8192</span>
                </div>
              </div>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
              >
                {saving ? <><RefreshCw className="size-4 animate-spin" /> Saving…</> : success ? <><CheckCircle className="size-4" /> Saved!</> : <><Save className="size-4" /> Save Configuration</>}
              </button>
            </div>
          </GlassCard>

          <GlassCard className="p-5 flex items-start gap-3 bg-secondary/20">
            <AlertCircle className="size-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Caution</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Changing temperature or disabling an agent takes effect on the next API request. Pro models yield deeper critiques but increase latency. Never store API keys in agent configuration.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
