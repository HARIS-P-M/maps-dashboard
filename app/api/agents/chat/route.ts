// app/api/agents/chat/route.ts
// ARIA Orchestrator — streaming chat agent

import { NextRequest } from 'next/server'
import { generateStream } from '@/lib/agents/groq-client'
import { ORCHESTRATOR_PROMPT } from '@/lib/agents/agent-prompts'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { message, history = [], userStats } = await req.json()

    if (!message || typeof message !== 'string') {
      return Response.json({ error: 'message is required' }, { status: 400 })
    }

    // Build a context block with the user's real stats if available
    let contextBlock = ''
    if (userStats) {
      contextBlock = `
CURRENT STUDENT STATS (use these to give personalized advice):
- Placement Probability: ${userStats.placementProb ?? 'N/A'}%
- ATS Resume Score: ${userStats.atsScore ?? 'N/A'}/100
- Interview Readiness: ${userStats.interviewReadiness ?? 'N/A'}%
- Study Streak: ${userStats.streak ?? 'N/A'} days
- Problems Solved: ${userStats.problemsSolved ?? 'N/A'}
- Mock Interviews Done: ${userStats.mockInterviews ?? 'N/A'}
`
    }

    const systemPrompt = ORCHESTRATOR_PROMPT + contextBlock

    // Convert UI history format to Groq message format
    const groqHistory = history.map((m: { role: string; text: string }) => ({
      role: m.role as 'user' | 'assistant',
      content: m.text,
    }))

    const stream = await generateStream(systemPrompt, message, groqHistory)

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Agent': 'orchestrator',
      },
    })
  } catch (error) {
    console.error('[ARIA Chat Agent Error]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Agent unavailable' },
      { status: 500 }
    )
  }
}
