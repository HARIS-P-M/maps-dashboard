'use client'

import { useState, useEffect } from 'react'
import { GlassCard } from '@/components/dashboard/glass-card'
import { AnimatedCounter } from '@/components/dashboard/animated-counter'
import {
  Activity,
  Users,
  Send,
  CheckCircle,
  TrendingUp,
  Bot,
  Target,
  Zap,
  AlertTriangle,
  BarChart3,
  RefreshCw,
  Clock,
  BookOpen,
  Code2,
  Brain,
  Video,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts'

const activityData = [
  { day: 'Mon', sessions: 38, agentCalls: 124, completions: 29 },
  { day: 'Tue', sessions: 52, agentCalls: 187, completions: 41 },
  { day: 'Wed', sessions: 47, agentCalls: 163, completions: 38 },
  { day: 'Thu', sessions: 61, agentCalls: 208, completions: 53 },
  { day: 'Fri', sessions: 55, agentCalls: 194, completions: 47 },
  { day: 'Sat', sessions: 29, agentCalls: 98,  completions: 22 },
  { day: 'Sun', sessions: 34, agentCalls: 112, completions: 28 },
]

const moduleUsageData = [
  { name: 'Coding Arena',   value: 34, color: 'var(--chart-1)' },
  { name: 'Resume',         value: 22, color: 'var(--chart-2)' },
  { name: 'Aptitude Lab',   value: 18, color: 'var(--chart-3)' },
  { name: 'Mock Interview', value: 14, color: 'var(--chart-4)' },
  { name: 'Company Intel',  value: 12, color: 'var(--chart-5)' },
]

const readinessBands = [
  { band: '0–20%',  count: 2 },
  { band: '21–40%', count: 5 },
  { band: '41–60%', count: 12 },
  { band: '61–80%', count: 18 },
  { band: '81–100%',count: 9 },
]

const recentActivity = [
  { user: 'Aarav Mehta',  action: 'Completed Mock Interview Round 3', module: 'Interview',  time: '2 min ago', icon: Video },
  { user: 'Priya Nair',   action: 'Resume analysed — ATS score 87',  module: 'Resume',    time: '8 min ago', icon: BookOpen },
  { user: 'Rohan Das',    action: 'Solved Median of Two Sorted Arrays', module: 'Coding', time: '14 min ago', icon: Code2 },
  { user: 'Sana Kapoor',  action: 'Aptitude drill — Quant (85%)',     module: 'Aptitude',  time: '22 min ago', icon: Brain },
  { user: 'Kiran Sharma', action: 'Roadmap updated by Coach Agent',   module: 'Roadmap',  time: '31 min ago', icon: Target },
  { user: 'Aditya Raj',   action: 'Company insight — Google SWE',     module: 'Company',  time: '45 min ago', icon: Bot },
]

export function AdminOverview() {
  const [broadcast, setBroadcast] = useState('')
  const [sent, setSent] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState(new Date())

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcast.trim()) return
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setBroadcast('')
    }, 2500)
  }

  const handleRefresh = () => {
    setRefreshing(true)
    setTimeout(() => {
      setRefreshing(false)
      setLastUpdated(new Date())
    }, 1000)
  }

  return (
    <div className="space-y-6">

      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Platform Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5">
            <Clock className="size-3" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 rounded-xl border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-secondary hover:text-foreground transition-all disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Students</span>
            <Users className="size-4 text-primary" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            <AnimatedCounter value={46} />
          </p>
          <p className="mt-1 text-xs text-success flex items-center gap-1">
            <TrendingUp className="size-3" /> +3 this week
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Active Today</span>
            <Activity className="size-4 text-accent" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            <AnimatedCounter value={34} />
          </p>
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <span className="size-1.5 rounded-full bg-success animate-pulse inline-block" />
            74% of cohort
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Agent Calls Today</span>
            <Bot className="size-4 text-chart-4" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            <AnimatedCounter value={347} />
          </p>
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <Zap className="size-3" /> avg 42ms latency
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-semibold uppercase tracking-wider">Avg. Readiness</span>
            <BarChart3 className="size-4 text-warning" />
          </div>
          <p className="mt-3 text-3xl font-bold tracking-tight">
            <AnimatedCounter value={71} suffix="%" />
          </p>
          <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
            <TrendingUp className="size-3 text-success" /> +4% vs last week
          </p>
        </GlassCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Activity Area Chart */}
        <GlassCard className="p-6 xl:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Weekly Activity</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Sessions, agent calls & module completions</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-1 inline-block" />Sessions</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-2 inline-block" />Agent Calls</span>
              <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-chart-3 inline-block" />Completions</span>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={activityData} margin={{ left: -20, right: 6, top: 6 }}>
                <defs>
                  <linearGradient id="sessGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="callGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-3)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--chart-3)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 12,
                    color: 'var(--popover-foreground)',
                    fontSize: 12,
                  }}
                />
                <Area type="monotone" dataKey="agentCalls" name="Agent Calls" stroke="var(--chart-2)" strokeWidth={1.5} fill="url(#callGrad)" />
                <Area type="monotone" dataKey="sessions" name="Sessions" stroke="var(--chart-1)" strokeWidth={2} fill="url(#sessGrad)" />
                <Area type="monotone" dataKey="completions" name="Completions" stroke="var(--chart-3)" strokeWidth={1.5} fill="url(#compGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Module Usage Pie */}
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-1">Module Usage</h3>
          <p className="text-xs text-muted-foreground mb-4">% of total AI sessions by module</p>
          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={moduleUsageData}
                  cx="50%"
                  cy="50%"
                  innerRadius={48}
                  outerRadius={72}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {moduleUsageData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                  formatter={(v) => [`${v}%`, '']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {moduleUsageData.map((m) => (
              <div key={m.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <span className="size-2 rounded-full inline-block flex-shrink-0" style={{ background: m.color }} />
                  {m.name}
                </span>
                <span className="font-semibold">{m.value}%</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Readiness Distribution + Broadcast + Recent Activity */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Readiness Bar Chart */}
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-1">Readiness Distribution</h3>
          <p className="text-xs text-muted-foreground mb-4">Students per readiness score band</p>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={readinessBands} margin={{ left: -24, right: 4, top: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="band" stroke="var(--muted-foreground)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: 'var(--popover)',
                    border: '1px solid var(--border)',
                    borderRadius: 10,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="count" name="Students" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Broadcast Announcement */}
        <GlassCard className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="font-semibold">Broadcast Announcement</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Send a system-wide alert to all connected students.
            </p>
          </div>
          <form onSubmit={handleBroadcast} className="mt-4 space-y-3">
            <textarea
              value={broadcast}
              onChange={(e) => setBroadcast(e.target.value)}
              placeholder="e.g. Scheduled maintenance at 02:00 UTC tonight. Please save your progress."
              className="w-full h-28 rounded-xl border border-border bg-secondary/30 p-3.5 text-sm outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-secondary/50 resize-none"
              required
              disabled={sent}
            />
            <button
              type="submit"
              disabled={sent || !broadcast.trim()}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95 disabled:opacity-50"
            >
              {sent ? (
                <><CheckCircle className="size-4" /> Announcement Sent</>
              ) : (
                <><Send className="size-4" /> Dispatch to All Students</>
              )}
            </button>
          </form>
        </GlassCard>

        {/* Recent Activity Feed */}
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4">Live Activity Feed</h3>
          <div className="space-y-3">
            {recentActivity.map((a, i) => {
              const Icon = a.icon
              return (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <div className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate text-xs">{a.user}</p>
                    <p className="text-xs text-muted-foreground leading-snug line-clamp-1">{a.action}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{a.time}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      </div>

      {/* System Health + Alerts */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4">Agent Health Monitor</h3>
          <div className="space-y-3">
            {[
              { name: 'Orchestrator',    latency: 38,  load: 34, status: 'Online' },
              { name: 'Resume Agent',    latency: 62,  load: 58, status: 'Online' },
              { name: 'Coding Agent',    latency: 78,  load: 72, status: 'Online' },
              { name: 'Interview Agent', latency: 41,  load: 12, status: 'Online' },
              { name: 'Company Agent',   latency: 55,  load: 41, status: 'Online' },
              { name: 'Coach Agent',     latency: 210, load: 27, status: 'Degraded' },
            ].map((agent) => (
              <div key={agent.name} className="flex items-center gap-4">
                <div className="w-32 shrink-0">
                  <p className="text-xs font-medium truncate">{agent.name}</p>
                </div>
                <div className="flex-1">
                  <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${agent.load > 70 ? 'bg-destructive' : agent.load > 40 ? 'bg-warning' : 'bg-primary'}`}
                      style={{ width: `${agent.load}%` }}
                    />
                  </div>
                </div>
                <div className="text-right shrink-0 w-14">
                  <p className="text-[10px] font-mono text-muted-foreground">{agent.latency}ms</p>
                </div>
                <div className="shrink-0">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md ${agent.status === 'Online' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                    <span className={`size-1.5 rounded-full ${agent.status === 'Online' ? 'bg-success' : 'bg-warning animate-pulse'}`} />
                    {agent.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <AlertTriangle className="size-4 text-warning" /> System Alerts
          </h3>
          <div className="space-y-3">
            <div className="rounded-xl border border-warning/30 bg-warning/10 p-3.5">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="size-4 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-warning">Coach Agent High Latency</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Response time 210ms — above 150ms threshold. Auto-retry enabled.</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Triggered 5 min ago</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/20 p-3.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="size-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">All Agent API Keys Valid</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Groq API keys checked — all active, no rotation needed.</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Verified 1 hr ago</p>
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-border bg-secondary/20 p-3.5">
              <div className="flex items-start gap-2.5">
                <CheckCircle className="size-4 text-success shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">Database Connection Stable</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Prisma ORM connected. No migration pending.</p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1">Checked 2 min ago</p>
                </div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

    </div>
  )
}
