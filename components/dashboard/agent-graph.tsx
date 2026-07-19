'use client'

import { useMemo } from 'react'
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import { Bot, FileText, Code2, Video, Building2, Compass } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type AgentData = {
  label: string
  sub: string
  icon: LucideIcon
  status: 'active' | 'idle'
  hub?: boolean
}

function AgentNode({ data }: NodeProps<Node<AgentData>>) {
  const Icon = data.icon
  return (
    <div
      className={`glass flex w-[168px] items-center gap-2.5 rounded-2xl px-3 py-2.5 ${
        data.hub ? 'shadow-[0_0_36px_-6px_var(--glow)] ring-1 ring-primary/40' : ''
      }`}
    >
      <Handle type="target" position={Position.Top} className="!size-1.5 !border-0 !bg-primary/60" />
      <Handle type="source" position={Position.Bottom} className="!size-1.5 !border-0 !bg-primary/60" />
      <Handle type="source" position={Position.Right} id="r" className="!size-1.5 !border-0 !bg-primary/60" />
      <Handle type="target" position={Position.Left} id="l" className="!size-1.5 !border-0 !bg-primary/60" />
      <span
        className={`grid size-8 shrink-0 place-items-center rounded-lg ${
          data.hub ? 'bg-primary/20 text-primary' : 'bg-secondary text-foreground'
        }`}
      >
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold">{data.label}</p>
        <p className="flex items-center gap-1 truncate text-[0.62rem] text-muted-foreground">
          <span className={`size-1.5 rounded-full ${data.status === 'active' ? 'bg-success' : 'bg-muted-foreground'}`} />
          {data.sub}
        </p>
      </div>
    </div>
  )
}

const nodeTypes = { agent: AgentNode }

export function AgentGraph({ height = 380 }: { height?: number }) {
  const nodes = useMemo<Node<AgentData>[]>(
    () => [
      { id: 'orc', type: 'agent', position: { x: 250, y: 150 }, data: { label: 'Orchestrator', sub: 'routing', icon: Bot, status: 'active', hub: true } },
      { id: 'resume', type: 'agent', position: { x: 20, y: 20 }, data: { label: 'Resume Agent', sub: 'analyzing', icon: FileText, status: 'active' } },
      { id: 'coding', type: 'agent', position: { x: 500, y: 20 }, data: { label: 'Coding Agent', sub: 'reviewing', icon: Code2, status: 'active' } },
      { id: 'interview', type: 'agent', position: { x: 0, y: 290 }, data: { label: 'Interview Agent', sub: 'idle', icon: Video, status: 'idle' } },
      { id: 'company', type: 'agent', position: { x: 520, y: 290 }, data: { label: 'Company Agent', sub: 'matching', icon: Building2, status: 'active' } },
      { id: 'coach', type: 'agent', position: { x: 250, y: 320 }, data: { label: 'Coach Agent', sub: 'planning', icon: Compass, status: 'active' } },
    ],
    [],
  )

  const edges = useMemo<Edge[]>(() => {
    const base = { animated: true, style: { stroke: 'var(--primary)', strokeWidth: 1.5, opacity: 0.5 } }
    return [
      { id: 'e1', source: 'resume', target: 'orc', ...base },
      { id: 'e2', source: 'coding', target: 'orc', ...base },
      { id: 'e3', source: 'orc', target: 'interview', ...base },
      { id: 'e4', source: 'orc', target: 'company', ...base },
      { id: 'e5', source: 'orc', target: 'coach', ...base },
      { id: 'e6', source: 'coach', sourceHandle: 'r', target: 'company', targetHandle: 'l', ...base, animated: false },
    ]
  }, [])

  return (
    <div style={{ height }} className="w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        nodesDraggable
        nodesConnectable={false}
        panOnScroll={false}
        zoomOnScroll={false}
        preventScrolling={false}
        className="rounded-2xl"
      >
        <Background variant={BackgroundVariant.Dots} gap={22} size={1} color="var(--muted-foreground)" bgColor="transparent" />
      </ReactFlow>
    </div>
  )
}
