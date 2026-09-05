'use client'
// lib/agents/use-agent.ts
// Reusable React hook for calling any MAPS agent API route

import { useState, useCallback } from 'react'

export type AgentName = 'chat' | 'resume' | 'coding' | 'interview' | 'coach' | 'company'

type AgentState<T> = {
  data: T | null
  isLoading: boolean
  error: string | null
  streamText: string
}

/**
 * useAgent — generic hook for non-streaming agent calls
 * Usage: const { data, isLoading, error, call } = useAgent<ResumeResult>('resume')
 */
export function useAgent<T = string>(agentName: AgentName) {
  const [state, setState] = useState<AgentState<T>>({
    data: null,
    isLoading: false,
    error: null,
    streamText: '',
  })

  const call = useCallback(
    async (body: Record<string, unknown>): Promise<T | null> => {
      setState((s) => ({ ...s, isLoading: true, error: null }))
      try {
        const res = await fetch(`/api/agents/${agentName}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(err.error ?? `Agent error: ${res.status}`)
        }

        const json: T = await res.json()
        setState((s) => ({ ...s, data: json, isLoading: false }))
        return json
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Something went wrong'
        setState((s) => ({ ...s, error: msg, isLoading: false }))
        return null
      }
    },
    [agentName]
  )

  const reset = useCallback(() => {
    setState({ data: null, isLoading: false, error: null, streamText: '' })
  }, [])

  return { ...state, call, reset }
}

/**
 * useStreamingAgent — hook for streaming chat agent calls (ARIA)
 * Accumulates streamed text character by character into streamText
 */
export function useStreamingAgent() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [streamText, setStreamText] = useState('')

  const stream = useCallback(
    async (
      message: string,
      history: { role: 'user' | 'assistant'; text: string }[],
      userStats?: Record<string, unknown>
    ): Promise<string> => {
      setIsLoading(true)
      setError(null)
      setStreamText('')

      let fullText = ''

      try {
        const res = await fetch('/api/agents/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message, history, userStats }),
        })

        if (!res.ok || !res.body) {
          const err = await res.json().catch(() => ({ error: 'Unknown error' }))
          throw new Error(err.error ?? `Chat agent error: ${res.status}`)
        }

        const reader = res.body.getReader()
        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          fullText += chunk
          setStreamText((prev) => prev + chunk)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Something went wrong'
        setError(msg)
      } finally {
        setIsLoading(false)
      }

      return fullText
    },
    []
  )

  return { stream, isLoading, error, streamText }
}
