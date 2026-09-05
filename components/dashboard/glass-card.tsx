'use client'

import { cn } from '@/lib/utils'

// PERF: Removed motion.div wrapper from GlassCard.
// Previously every single card on every page was a Framer Motion element,
// causing dozens of JS animation observers. Now it's a plain div.
// Animations are handled at the page/section level only where needed.

type GlassCardProps = React.HTMLAttributes<HTMLDivElement> & {
  glow?: boolean
  hover?: boolean
}

export function GlassCard({ className, glow, hover = true, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass relative overflow-hidden rounded-2xl',
        glow && 'glow',
        hover && 'transition-shadow duration-200 hover:shadow-[0_8px_36px_-10px_var(--glow)]',
        className,
      )}
      {...props}
    >
      {children}
    </div>
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
