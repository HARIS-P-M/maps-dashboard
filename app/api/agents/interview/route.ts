// app/api/agents/interview/route.ts
// Interview Agent — STAR-method answer scoring with resume context + session memory

import { NextRequest } from 'next/server'
import { generateText } from '@/lib/agents/groq-client'
import { INTERVIEW_AGENT_PROMPT } from '@/lib/agents/agent-prompts'
import { jsonrepair } from 'jsonrepair'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const {
      question,
      userAnswer,
      role,
      company,
      resumeText,       // ← NEW: resume context for personalized evaluation
      sessionHistory,   // ← NEW: past evaluations in this session
    } = await req.json()

    if (!question || !userAnswer) {
      return Response.json(
        { error: 'question and userAnswer are required' },
        { status: 400 }
      )
    }

    const historyContext = sessionHistory?.length > 0
      ? `\nPast evaluations in this session:\n${sessionHistory
          .slice(-3)
          .map((h: any, i: number) => `Q${i + 1}: "${h.question}" → Score: ${h.overallScore}/10 (${h.verdict})`)
          .join('\n')}\nNote any improvement trend or recurring weaknesses.`
      : ''

    const resumeContext = resumeText
      ? `\nCandidate's Resume Context (for evaluating relevance and authenticity):\n${resumeText.slice(0, 1500)}`
      : ''

    const userMessage = `
Interview Question: "${question}"
Target Role: ${role ?? 'Software Engineer'}
Target Company: ${company ?? 'a tech company'}
${resumeContext}
${historyContext}

Candidate's Answer:
"${userAnswer}"

Evaluate this answer:
1. Score using STAR framework, clarity, confidence, and relevance to the role.
2. Check if their answer aligns with real experiences from their resume (if provided).
3. If session history is available, comment on improvement since the last question.
4. Rewrite their answer to be much stronger.
5. Provide the ideal benchmark answer a top candidate would give.
`

    const raw = await generateText(
      INTERVIEW_AGENT_PROMPT,
      userMessage,
      [],
      'llama-3.3-70b-versatile'   // Stronger model for high-quality evaluation
    )

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json(
        { error: 'Could not parse interview evaluation. Try again.' },
        { status: 500 }
      )
    }

    let sanitized = jsonMatch[0]
    try { sanitized = jsonrepair(sanitized) } catch {}

    const result = JSON.parse(sanitized)
    return Response.json(result)
  } catch (error) {
    console.error('[Interview Agent Error]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Interview agent unavailable' },
      { status: 500 }
    )
  }
}
