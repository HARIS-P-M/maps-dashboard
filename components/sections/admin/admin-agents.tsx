'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { GlassCard, SectionHeading } from '@/components/dashboard/glass-card'
import { AnimatedCounter } from '@/components/dashboard/animated-counter'
import {
  Save,
  ToggleLeft,
  ToggleRight,
  Settings,
  AlertCircle,
  CheckCircle,
  Activity,
  Zap,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Cpu,
  ArrowUpRight,
  Sliders,
  Sparkles,
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

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
}

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
  'openai/gpt-oss-20b',
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'llama3-70b-8192',
]

export function AdminAgents() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedId, setSelectedId] = useState('orchestrator')
  const [success, setSuccess] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    void fetch('/api/admin/agents', { cache: 'no-store' })
      .then(async (response) => {
        const data = await response.json()
        if (!response.ok) throw new Error(data.error || 'Unable to load agent configuration.')
        setAgents(data.agents.map((agent: {
          agentName: string
          model: string
          temperature: number
          maxTokens: number
          enabled: boolean
        }) => {
          const fallback = initialAgents.find((item) => item.id === agent.agentName.toLowerCase()) ?? initialAgents[0]
          return {
            ...fallback,
            id: agent.agentName.toLowerCase(),
            model: agent.model,
            temp: agent.temperature,
            maxTokens: agent.maxTokens,
            status: (agent.enabled ? 'Online' : 'Offline') as AgentStatus,
            load: 0,
            avgLatency: 0,
            callsToday: 0,
            errorsToday: 0,
            successRate: 0,
          }
        }))
      })
      .catch((error) => setLoadError(error instanceof Error ? error.message : 'Unable to load agent configuration.'))
  }, [])

  const active = agents.find(a => a.id === selectedId) ?? initialAgents[0]

  const update = (fields: Partial<Agent>) => {
    setAgents(prev => prev.map(a => a.id === selectedId ? { ...a, ...fields } : a))
  }

  const saveSettings = async () => {
    if (!agents.some((agent) => agent.id === selectedId)) return
    setSaving(true)
    setLoadError('')
    try {
      const response = await fetch(`/api/admin/agents/${active.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: active.status === 'Online',
          model: active.model,
          temperature: active.temp,
          maxTokens: active.maxTokens,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to save agent configuration.')
      setSaving(false)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : 'Unable to save agent configuration.')
      setSaving(false)
    }
  }

  const toggleStatus = async (id: string) => {
    const current = agents.find((agent) => agent.id === id)
    if (!current) return
    const next: AgentStatus = current.status === 'Online' ? 'Offline' : 'Online'
    setAgents(prev => prev.map(a => {
      if (a.id !== id) return a
      return { ...a, status: next, load: next === 'Online' ? a.load : 0 }
    }))
    try {
      const response = await fetch(`/api/admin/agents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: next === 'Online' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Unable to update agent status.')
    } catch (error) {
      setAgents(prev => prev.map(a => a.id === id ? current : a))
      setLoadError(error instanceof Error ? error.message : 'Unable to update agent status.')
    }
  }

  const totalCalls = agents.reduce((s, a) => s + a.callsToday, 0)
  const totalErrors = agents.reduce((s, a) => s + a.errorsToday, 0)
  const avgSuccess = agents.length
    ? agents.reduce((s, a) => s + a.successRate, 0) / agents.length
    : 0
  const onlineCount = agents.filter(a => a.status === 'Online').length

  const stats = [
    {
      label: 'Total Calls Today',
      value: totalCalls,
      suffix: '',
      delta: 'Across 6 agents',
      icon: Activity,
      color: 'text-chart-1',
      bg: 'bg-chart-1/15',
    },
    {
      label: 'Avg. Success Rate',
      value: Math.round(avgSuccess),
      suffix: '%',
      delta: `${totalErrors} errors total`,
      icon: TrendingUp,
      color: 'text-chart-2',
      bg: 'bg-chart-2/15',
    },
    {
      label: 'Online Fleet',
      value: onlineCount,
      suffix: ` / ${agents.length}`,
      delta: 'All monitored',
      icon: Zap,
      color: 'text-chart-4',
      bg: 'bg-chart-4/15',
    },
    {
      label: 'Mean Latency',
      value: Math.round(agents.reduce((s, a) => s + a.avgLatency, 0) / agents.length),
      suffix: ' ms',
      delta: 'Fast inference',
      icon: Cpu,
      color: 'text-chart-5',
      bg: 'bg-chart-5/15',
    },
  ]

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {loadError && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {loadError}
        </div>
      )}
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <p className="font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
            AUTONOMOUS AGENTS
          </p>
          <h2 className="text-xl font-bold tracking-tight">Agent Control Room</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Real-time inference parameters, telemetry, and live runtime overrides.
          </p>
        </div>
      </motion.div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl bg-success/15 border border-success/30 p-4 text-sm text-success"
        >
          <CheckCircle className="size-4" /> Agent configuration saved and pushed to runtime orchestrator.
        </motion.div>
      )}

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon
          return (
            <motion.div key={s.label} variants={item}>
              <GlassCard className="p-5">
                <div className="flex items-start justify-between">
                  <span className={`grid size-10 place-items-center rounded-xl ${s.bg} ${s.color}`}>
                    <Icon className="size-5" />
                  </span>
                  <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                    <ArrowUpRight className="size-3" />
                    {s.delta}
                  </span>
                </div>
                <p className="mt-4 text-3xl font-semibold tracking-tight">
                  <AnimatedCounter value={typeof s.value === 'number' ? s.value : 0} suffix={s.suffix} />
                </p>
                <p className="mt-1 text-sm text-muted-foreground">{s.label}</p>
              </GlassCard>
            </motion.div>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <motion.div variants={item}>
          <GlassCard className="h-full p-6">
            <SectionHeading
              eyebrow="INFERENCE LATENCY"
              title="Agent Response Time Trend"
            />
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={latencyHistory} margin={{ left: -20, right: 6, top: 6 }}>
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
        </motion.div>

        <motion.div variants={item}>
          <GlassCard className="h-full p-6">
            <SectionHeading
              eyebrow="WORKLOAD DISTRIBUTION"
              title="Calls by Agent Today"
            />
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={callsByAgent} layout="vertical" margin={{ left: 8, right: 24, top: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} tickLine={false} axisLine={false} width={64} />
                  <Tooltip contentStyle={{ background: 'var(--popover)', border: '1px solid var(--border)', borderRadius: 10, fontSize: 11 }} />
                  <Bar dataKey="calls" name="Calls" fill="var(--primary)" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </motion.div>
      </div>

      {/* Agent Grid + Config Panel */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Agent Cards */}
        <motion.div variants={item} className="lg:col-span-2 space-y-4">
          <SectionHeading
            eyebrow="ACTIVE AGENTS"
            title="Agent Fleet Status"
            action={<p className="text-xs text-muted-foreground">Select to tune parameters</p>}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {agents.map(a => (
              <GlassCard
                key={a.id}
                onClick={() => setSelectedId(a.id)}
                className={`p-5 cursor-pointer border transition-all ${
                  selectedId === a.id
                    ? 'border-primary/60 bg-primary/5 ring-2 ring-primary/25 shadow-[0_0_24px_rgba(var(--primary-rgb),0.15)]'
                    : 'hover:border-border/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h4 className="font-semibold text-sm flex items-center gap-1.5">
                      {a.name}
                      {selectedId === a.id && (
                        <span className="size-1.5 rounded-full bg-primary animate-pulse" />
                      )}
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{a.role}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md ${a.status === 'Online' ? 'bg-success/15 text-success' : a.status === 'Offline' ? 'bg-muted text-muted-foreground' : 'bg-warning/15 text-warning'}`}>
                    <span className={`size-1.5 rounded-full ${a.status === 'Online' ? 'bg-success animate-pulse' : a.status === 'Offline' ? 'bg-muted-foreground' : 'bg-warning'}`} />
                    {a.status}
                  </span>
                </div>

                <div className="mt-3.5 grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-xl bg-secondary/40 p-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Calls</p>
                    <p className="text-sm font-bold mt-0.5">{a.callsToday}</p>
                  </div>
                  <div className="rounded-xl bg-secondary/40 p-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Latency</p>
                    <p className="text-sm font-bold mt-0.5">{a.avgLatency}ms</p>
                  </div>
                  <div className="rounded-xl bg-secondary/40 p-2">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Success</p>
                    <p className={`text-sm font-bold mt-0.5 ${a.successRate >= 98 ? 'text-success' : a.successRate >= 90 ? 'text-warning' : 'text-destructive'}`}>{a.successRate}%</p>
                  </div>
                </div>

                <div className="mt-3.5 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-mono">Model</p>
                    <p className="text-xs font-mono font-medium">{a.model.split('-').slice(0, 3).join('-')}</p>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); toggleStatus(a.id) }}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1"
                    title={a.status === 'Online' ? 'Disable Agent' : 'Enable Agent'}
                  >
                    {a.status === 'Online' ? <ToggleRight className="size-6 text-primary" /> : <ToggleLeft className="size-6" />}
                  </button>
                </div>

                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-muted-foreground mb-1 uppercase tracking-wider font-mono">
                    <span>Concurrency Load</span>
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
        </motion.div>

        {/* Configuration Panel */}
        <motion.div variants={item} className="space-y-4">
          <GlassCard glow className="p-6">
            <div className="mb-5 flex items-center gap-2">
              <span className="grid size-8 place-items-center rounded-lg bg-primary/15 text-primary">
                <Sliders className="size-4" />
              </span>
              <div>
                <h3 className="font-semibold text-sm">Tune: {active.name}</h3>
                <p className="text-[11px] text-muted-foreground">Adjust runtime temperature & tokens</p>
              </div>
            </div>

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
                  className="mt-2 w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/50 font-mono text-xs"
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
                  <span className="text-xs font-mono font-semibold bg-secondary/50 px-2 py-0.5 rounded-md">{active.temp.toFixed(1)}</span>
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
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                  <span>Deterministic (0.0)</span>
                  <span>Creative (1.0)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="agentTokens">
                    Max Output Tokens
                  </label>
                  <span className="text-xs font-mono font-semibold bg-secondary/50 px-2 py-0.5 rounded-md">{active.maxTokens.toLocaleString()}</span>
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
                <div className="flex justify-between text-[10px] text-muted-foreground mt-1 font-mono">
                  <span>256</span>
                  <span>8,192</span>
                </div>
              </div>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
              >
                {saving ? (
                  <><RefreshCw className="size-4 animate-spin" /> Saving…</>
                ) : success ? (
                  <><CheckCircle className="size-4" /> Parameters Updated</>
                ) : (
                  <><Save className="size-4" /> Save Configuration</>
                )}
              </button>
            </div>
          </GlassCard>

          <GlassCard className="p-5 flex items-start gap-3 bg-secondary/20">
            <AlertCircle className="size-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider">Operational Note</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Changes take effect dynamically without requiring server restart. Orchestrator maintains circuit breakers if error rates exceed 5%.
              </p>
            </div>
          </GlassCard>
        </motion.div>
      </div>
    </motion.div>
  )
}
