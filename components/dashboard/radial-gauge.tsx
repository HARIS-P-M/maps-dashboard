'use client'

import { motion } from 'framer-motion'
import { AnimatedCounter } from './animated-counter'

export function RadialGauge({
  value,
  size = 160,
  stroke = 12,
  label,
  color = 'var(--chart-1)',
  suffix = '%',
}: {
  value: number
  size?: number
  stroke?: number
  label?: string
  color?: string
  suffix?: string
}) {
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const offset = c - (value / 100) * c

  return (
    <div className="relative grid place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={{ strokeDashoffset: c }}
          whileInView={{ strokeDashoffset: offset }}
          viewport={{ once: true }}
          transition={{ duration: 1.6, ease: 'easeOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${color})` }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-semibold tracking-tight">
          <AnimatedCounter value={value} suffix={suffix} />
        </span>
        {label && <span className="mt-0.5 text-xs text-muted-foreground">{label}</span>}
      </div>
    </div>
  )
}
