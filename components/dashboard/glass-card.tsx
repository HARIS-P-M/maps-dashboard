'use client'

import { motion, type HTMLMotionProps } from 'framer-motion'
import { cn } from '@/lib/utils'

type GlassCardProps = HTMLMotionProps<'div'> & {
  glow?: boolean
  hover?: boolean
}

export function GlassCard({ className, glow, hover = true, children, ...props }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'glass relative overflow-hidden rounded-2xl',
        glow && 'glow',
        hover && 'transition-shadow duration-300 hover:shadow-[0_10px_50px_-12px_var(--glow)]',
        className,
      )}
      {...props}
    >
      {children}
    </motion.div>
  )
}

export function SectionHeading({
  eyebrow,
  title,
  action,
}: {
  eyebrow?: string
  title: string
  action?: React.ReactNode
}) {
  return (
    <div className="mb-4 flex items-end justify-between gap-4">
      <div>
        {eyebrow && (
          <p className="mb-1 font-mono text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        )}
        <h2 className="text-pretty text-lg font-semibold">{title}</h2>
      </div>
      {action}
    </div>
  )
}
