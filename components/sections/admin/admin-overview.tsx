'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/dashboard/glass-card'
import { AnimatedCounter } from '@/components/dashboard/animated-counter'
import {
  Activity,
  Cpu,
  Database,
  Users,
  Send,
  CheckCircle,
} from 'lucide-react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

const performanceData = [
  { time: '09:00', cpu: 12, memory: 38, latency: 85 },
  { time: '10:00', cpu: 24, memory: 40, latency: 98 },
  { time: '11:00', cpu: 18, memory: 42, latency: 92 },
  { time: '12:00', cpu: 32, memory: 45, latency: 110 },
  { time: '13:00', cpu: 15, memory: 44, latency: 88 },
  { time: '14:00', cpu: 28, memory: 46, latency: 104 },
  { time: '15:00', cpu: 22, memory: 45, latency: 95 },
]

export function AdminOverview() {
  const [broadcast, setBroadcast] = useState('')
  const [sent, setSent] = useState(false)

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault()
    if (!broadcast.trim()) return
    setSent(true)
    setTimeout(() => {
      setSent(false)
      setBroadcast('')
    }, 2500)
  }

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm">Active Sessions</span>
            <Users className="size-4 text-primary" />
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            <AnimatedCounter value={14} />
            <span className="text-xs font-normal text-success ml-2">● Online</span>
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm">API Latency</span>
            <Activity className="size-4 text-accent" />
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            <AnimatedCounter value={95} />
            <span className="text-sm font-medium text-muted-foreground ml-1">ms</span>
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm">CPU Load</span>
            <Cpu className="size-4 text-primary" />
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            <AnimatedCounter value={22} />
            <span className="text-sm font-medium text-muted-foreground ml-1">%</span>
          </p>
        </GlassCard>

        <GlassCard className="p-5">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-sm">Memory (Ram)</span>
            <Database className="size-4 text-warning" />
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-tight">
            <AnimatedCounter value={420} />
            <span className="text-sm font-medium text-muted-foreground ml-1">MB</span>
          </p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Graph */}
        <GlassCard className="p-6 xl:col-span-2">
          <h2 className="mb-4 text-lg font-semibold">System Load & Latency</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={performanceData} margin={{ left: -20, right: 10, top: 10 }}>
                <defs>
                  <linearGradient id="latencyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
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
                <Area type="monotone" dataKey="latency" name="Latency (ms)" stroke="var(--chart-1)" strokeWidth={2} fill="url(#latencyGrad)" />
                <Area type="monotone" dataKey="cpu" name="CPU (%)" stroke="var(--chart-2)" strokeWidth={1.5} fill="transparent" strokeDasharray="4 4" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Broadcast portal */}
        <GlassCard className="p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-lg font-semibold">Broadcast Announcement</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Send a real-time header alert to all currently connected students and agent workers.
            </p>
          </div>

          <form onSubmit={handleBroadcast} className="mt-6 space-y-4">
            <textarea
              value={broadcast}
              onChange={(e) => setBroadcast(e.target.value)}
              placeholder="e.g. Schedule Maintenance at 02:00 UTC today..."
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
                <>
                  <CheckCircle className="size-4" /> Sent Broadcast
                </>
              ) : (
                <>
                  <Send className="size-4" /> Dispatch Banner
                </>
              )}
            </button>
          </form>
        </GlassCard>
      </div>

      {/* System Status Table */}
      <GlassCard className="p-6">
        <h2 className="mb-4 text-lg font-semibold">Gateway Node Status</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <th className="pb-3 font-semibold">Node Name</th>
                <th className="pb-3 font-semibold">IP Address</th>
                <th className="pb-3 font-semibold">Latency</th>
                <th className="pb-3 font-semibold">Status</th>
                <th className="pb-3 font-semibold text-right">Uptime</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50">
              <tr>
                <td className="py-3 font-medium">aps-gateway-asia-01</td>
                <td className="py-3 font-mono text-xs">10.152.177.10</td>
                <td className="py-3">12ms</td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                    Healthy
                  </span>
                </td>
                <td className="py-3 text-right">14d 6h</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">aps-gateway-us-02</td>
                <td className="py-3 font-mono text-xs">10.152.177.11</td>
                <td className="py-3">82ms</td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
                    Healthy
                  </span>
                </td>
                <td className="py-3 text-right">9d 12h</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">aps-gateway-eu-03</td>
                <td className="py-3 font-mono text-xs">10.152.177.12</td>
                <td className="py-3">145ms</td>
                <td className="py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning">
                    Degraded
                  </span>
                </td>
                <td className="py-3 text-right">3d 4h</td>
              </tr>
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  )
}
