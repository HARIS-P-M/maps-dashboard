// Placement Coordinator Agent — selects and sequences specialist agents.

import { NextRequest } from 'next/server'
import { generateText } from '@/lib/agents/groq-client'
import { ORCHESTRATOR_PLAN_PROMPT } from '@/lib/agents/agent-prompts'
import { jsonrepair } from 'jsonrepair'
import { AGENT_MODELS } from '@/lib/agents/model-registry'

export const runtime = 'nodejs'

const MAX_MESSAGE_LENGTH = 4000

type StudentContext = {
  resumeScore?: number
  jdMatchScore?: number | null
  aptitudeWeakTopics?: string[]
  interviewAvgScore?: number
  codingSuccessRate?: number
  targetRole?: string
  targetCompany?: string
  placementProbability?: number
}

function isStudentContext(value: unknown): value is StudentContext {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export async function POST(req: NextRequest) {
  try {
    const body: unknown = await req.json()

    if (typeof body !== 'object' || body === null || Array.isArray(body)) {
      return Response.json({ error: 'Request body must be an object' }, { status: 400 })
    }

    const { message, studentContext } = body as {
      message?: unknown
      studentContext?: unknown
    }

    if (typeof message !== 'string' || !message.trim()) {
      return Response.json({ error: 'message is required' }, { status: 400 })
    }

    const trimmedMessage = message.trim()
    if (trimmedMessage.length > MAX_MESSAGE_LENGTH) {
      return Response.json(
        { error: `message must be ${MAX_MESSAGE_LENGTH} characters or fewer` },
        { status: 413 }
      )
    }

    const context = isStudentContext(studentContext) ? studentContext : undefined
    const contextBlock = context
      ? JSON.stringify(context)
      : 'No student performance context was provided.'

    const raw = await generateText(
      ORCHESTRATOR_PLAN_PROMPT,
      `STUDENT REQUEST:\n${trimmedMessage}\n\nSTUDENT CONTEXT:\n${contextBlock}`,
      [],
      AGENT_MODELS.orchestrator,
      true,
      0.2
    )

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: 'Could not parse coordinator plan. Try again.' }, { status: 502 })
    }

    const result = JSON.parse(jsonrepair(jsonMatch[0])) as unknown
    if (
      typeof result !== 'object' ||
      result === null ||
      !Array.isArray((result as { agents?: unknown }).agents)
    ) {
      return Response.json({ error: 'Coordinator returned an invalid plan.' }, { status: 502 })
    }

    return Response.json(result, {
      headers: { 'X-Agent': 'placement-coordinator' },
    })
  } catch (error) {
    console.error('[Placement Coordinator Error]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Coordinator unavailable' },
      { status: 500 }
    )
  }
}
