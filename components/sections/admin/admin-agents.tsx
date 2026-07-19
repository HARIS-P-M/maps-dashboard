'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/dashboard/glass-card'
import { Save, ToggleLeft, ToggleRight, Radio, Settings, PlayCircle, AlertCircle } from 'lucide-react'

type Agent = {
  id: string
  name: string
  role: string
  status: 'Online' | 'Offline' | 'Maintenance'
  model: string
  temp: number
  load: number
}

const initialAgents: Agent[] = [
  { id: 'orchestrator', name: 'Orchestrator', role: 'Coordinates all sub-agents', status: 'Online', model: 'gemini-3.5-flash', temp: 0.2, load: 34 },
  { id: 'resume', name: 'Resume Agent', role: 'ATS & keyword matching', status: 'Online', model: 'gemini-3.5-flash', temp: 0.5, load: 58 },
  { id: 'coding', name: 'Coding Agent', role: 'DSA hints & compiler feedback', status: 'Online', model: 'gemini-3.5-pro', temp: 0.3, load: 72 },
  { id: 'interview', name: 'Interview Agent', role: 'Behavioral speech & text assessment', status: 'Online', model: 'gemini-3.5-pro', temp: 0.7, load: 12 },
  { id: 'company', name: 'Company Agent', role: 'JD mapping & interview windows', status: 'Online', model: 'gemini-3.5-flash', temp: 0.4, load: 41 },
  { id: 'coach', name: 'Coach Agent', role: 'Learning plans & activity nudges', status: 'Online', model: 'gemini-3.5-flash', temp: 0.6, load: 27 },
]

export function AdminAgents() {
  const [agents, setAgents] = useState<Agent[]>(initialAgents)
  const [selectedAgentId, setSelectedAgentId] = useState<string>('orchestrator')
  const [success, setSuccess] = useState(false)

  const activeAgent = agents.find((a) => a.id === selectedAgentId) || agents[0]

  const updateSelectedAgent = (fields: Partial<Agent>) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === selectedAgentId) {
          return { ...a, ...fields }
        }
        return a
      })
    )
  }

  const saveSettings = () => {
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2000)
  }

  const toggleStatus = (id: string) => {
    setAgents((prev) =>
      prev.map((a) => {
        if (a.id === id) {
          const nextStatus = a.status === 'Online' ? 'Offline' : 'Online'
          return { ...a, status: nextStatus, load: nextStatus === 'Online' ? a.load : 0 }
        }
        return a
      })
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Agent Command Center</h2>
          <p className="text-xs text-muted-foreground">Toggle statuses and configure parameters for active AI placement agents.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Agent Grid Selection */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {agents.map((a) => (
              <GlassCard
                key={a.id}
                onClick={() => setSelectedAgentId(a.id)}
                className={`p-5 cursor-pointer border transition-all ${
                  selectedAgentId === a.id ? 'border-primary/60 bg-primary/5 ring-1 ring-primary/20' : 'hover:border-border/80'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm">{a.name}</h3>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{a.role}</p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider rounded-md ${
                      a.status === 'Online'
                        ? 'bg-success/15 text-success'
                        : a.status === 'Offline'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-warning/15 text-warning'
                    }`}
                  >
                    <span className={`size-1.5 rounded-full ${a.status === 'Online' ? 'bg-success animate-pulse' : a.status === 'Offline' ? 'bg-muted-foreground' : 'bg-warning'}`} />
                    {a.status}
                  </span>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Active Model</p>
                    <p className="text-xs font-mono font-medium">{a.model}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleStatus(a.id)
                    }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title={a.status === 'Online' ? 'Disable Agent' : 'Enable Agent'}
                  >
                    {a.status === 'Online' ? <ToggleRight className="size-6 text-primary" /> : <ToggleLeft className="size-6" />}
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground mb-1 uppercase tracking-widest">
                    <span>Thread Load</span>
                    <span>{a.load}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${a.load > 70 ? 'bg-destructive' : a.load > 40 ? 'bg-warning' : 'bg-primary'}`}
                      style={{ width: `${a.load}%` }}
                    />
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Configurations Panel */}
        <div className="space-y-4">
          <GlassCard className="p-6">
            <h3 className="font-semibold text-base mb-4 flex items-center gap-2">
              <Settings className="size-4 text-primary" /> Configuration: {activeAgent.name}
            </h3>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="agentStatus">
                  Agent Operation Status
                </label>
                <select
                  id="agentStatus"
                  value={activeAgent.status}
                  onChange={(e) => updateSelectedAgent({ status: e.target.value as any })}
                  className="mt-2 w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/50 focus:bg-secondary/50"
                >
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                  <option value="Maintenance">Maintenance</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="agentModel">
                  Select LLM Model Backing
                </label>
                <select
                  id="agentModel"
                  value={activeAgent.model}
                  onChange={(e) => updateSelectedAgent({ model: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-border bg-secondary/30 px-3.5 py-2.5 text-sm outline-none transition-all focus:border-primary/50 focus:bg-secondary/50"
                >
                  <option value="gemini-3.5-flash">Gemini 3.5 Flash (Default)</option>
                  <option value="gemini-3.5-pro">Gemini 3.5 Pro (Recommended for design)</option>
                  <option value="gemini-3.0-pro">Gemini 3.0 Pro Legacy</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground" htmlFor="agentTemp">
                    Temperature (Creativity)
                  </label>
                  <span className="text-xs font-mono font-medium">{activeAgent.temp}</span>
                </div>
                <input
                  id="agentTemp"
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={activeAgent.temp}
                  onChange={(e) => updateSelectedAgent({ temp: Number(e.target.value) })}
                  className="mt-2 w-full accent-primary bg-secondary rounded-lg cursor-pointer h-1.5"
                />
              </div>

              <div className="pt-2">
                <button
                  onClick={saveSettings}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground transition-all hover:opacity-95"
                >
                  {success ? 'Saved Settings!' : 'Save Configurations'}
                </button>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-5 flex items-start gap-3 bg-secondary/20">
            <AlertCircle className="size-5 text-accent shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">Orchestrator Nudge</h4>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Modifying parameters changes temperature configurations on the backend agents dynamically. Pro models yield deeper critiques but increase request latencies.
              </p>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  )
}
