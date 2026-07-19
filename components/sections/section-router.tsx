'use client'

import type { ViewId } from '@/lib/nav'
import { viewMeta } from '@/lib/nav'
import { Overview } from './overview'
import { Placeholder } from './placeholder'

export function SectionRouter({ view, onNavigate }: { view: ViewId; onNavigate: (v: ViewId) => void }) {
  switch (view) {
    case 'dashboard':
      return <Overview onNavigate={onNavigate} />
    default:
      return <Placeholder title={viewMeta[view].title} />
  }
}
