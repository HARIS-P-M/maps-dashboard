'use client'

import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
  Line,
  LineChart,
  Bar,
  BarChart,
  CartesianGrid,
} from 'recharts'

const tooltipStyle = {
  background: 'var(--popover)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  color: 'var(--popover-foreground)',
  fontSize: 12,
}

export function ProgressAreaChart({ data }: { data: { week: string; solved: number; target: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ left: -18, right: 8, top: 8 }}>
        <defs>
          <linearGradient id="gSolved" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.5} />
            <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="week" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} />
        <Area type="monotone" dataKey="target" stroke="var(--muted-foreground)" strokeDasharray="4 4" fill="transparent" strokeWidth={1.5} />
        <Area type="monotone" dataKey="solved" stroke="var(--chart-1)" strokeWidth={2.5} fill="url(#gSolved)" />
      </AreaChart>
    </ResponsiveContainer>
  )
}

export function ReadinessRadar({ data }: { data: { dimension: string; you: number; cohort: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RadarChart data={data} outerRadius="72%">
        <PolarGrid stroke="var(--border)" />
        <PolarAngleAxis dataKey="dimension" tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} />
        <Radar name="Cohort" dataKey="cohort" stroke="var(--muted-foreground)" fill="var(--muted-foreground)" fillOpacity={0.12} />
        <Radar name="You" dataKey="you" stroke="var(--chart-1)" fill="var(--chart-1)" fillOpacity={0.35} strokeWidth={2} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip contentStyle={tooltipStyle} />
      </RadarChart>
    </ResponsiveContainer>
  )
}

export function LanguageDonut({ data }: { data: { name: string; value: number }[] }) {
  const colors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={54} outerRadius={82} paddingAngle={3} stroke="none">
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Tooltip contentStyle={tooltipStyle} />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function ProbabilityLine({ data }: { data: { month: string; prob: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ left: -20, right: 8, top: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} domain={[30, 90]} />
        <Tooltip contentStyle={tooltipStyle} />
        <Line type="monotone" dataKey="prob" stroke="var(--chart-2)" strokeWidth={2.5} dot={{ r: 3, fill: 'var(--chart-2)' }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function SkillGapBars({ data }: { data: { skill: string; current: number; required: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data} layout="vertical" margin={{ left: 40, right: 12 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="skill" stroke="var(--muted-foreground)" fontSize={11} width={110} tickLine={false} axisLine={false} />
        <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="current" name="Current" fill="var(--chart-1)" radius={[0, 6, 6, 0]} barSize={10} />
        <Bar dataKey="required" name="Required" fill="var(--muted-foreground)" radius={[0, 6, 6, 0]} barSize={10} />
      </BarChart>
    </ResponsiveContainer>
  )
}
