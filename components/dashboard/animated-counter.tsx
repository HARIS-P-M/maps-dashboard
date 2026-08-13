'use client'

import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'framer-motion'

export function AnimatedCounter({
  value,
  decimals = 0,
  suffix = '',
  prefix = '',
  duration = 1.4,
}: {
  value: number
  decimals?: number
  suffix?: string
  prefix?: string
  duration?: number
}) {
  const [display, setDisplay] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const isInView = useInView(ref, { once: true, amount: 0.3 })
  const prevValue = useRef(0)

  useEffect(() => {
    if (isInView) {
      const controls = animate(prevValue.current, value, {
        duration,
        ease: 'easeOut',
        onUpdate: (v) => setDisplay(v),
      })
      prevValue.current = value
      return () => controls.stop()
    }
  }, [value, duration, isInView])

  return (
    <span ref={ref} className="tabular-nums">
      {prefix}
      {display.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  )
}
