// app/api/agents/company/route.ts
// Company Agent — company-specific prep and gap analysis with REAL user data

import { NextRequest } from 'next/server'
import { generateText } from '@/lib/agents/groq-client'
import { COMPANY_AGENT_PROMPT } from '@/lib/agents/agent-prompts'
import { jsonrepair } from 'jsonrepair'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const {
      companyName,
      role,
      resumeText,
      studentContext,     // ← Full intelligence snapshot from store
    } = await req.json()

    if (!companyName || !role) {
      return Response.json(
        { error: 'companyName and role are required' },
        { status: 400 }
      )
    }

    const ctx = studentContext
    const contextBlock = ctx ? `
REAL STUDENT PERFORMANCE DATA:
- Resume ATS Score: ${ctx.resumeScore}/100
- JD Match Score: ${ctx.jdMatchScore != null ? `${ctx.jdMatchScore}/100` : 'Not measured'}
- Resume Keyword Gaps: ${ctx.keywordGaps?.slice(0, 8).join(', ') || 'None'}
- Interview Average Score: ${ctx.interviewAvgScore?.toFixed(1) ?? '0'}/10
- Aptitude Accuracy: ${Object.entries(ctx.aptitudeAccuracy || {}).map(([t, a]) => `${t}: ${a}%`).join(', ') || 'No data'}
- Weak Aptitude Topics: ${ctx.aptitudeWeakTopics?.join(', ') || 'None identified'}
- Coding Problems Attempted: ${ctx.codingProblemsAttempted ?? 0}
- Coding Success Rate: ${ctx.codingSuccessRate ?? 0}%
- DSA Topics Covered: ${ctx.codingTopicsCovered?.join(', ') || 'None'}
- Current Placement Probability: ${ctx.placementProbability ?? 0}%
` : '(No performance data — provide general analysis)'

    const resumeBlock = resumeText
      ? `\nSTUDENT RESUME:\n"${resumeText.slice(0, 2500)}"`
      : '(No resume provided)'

    const userMessage = `
Analyze this student's readiness for ${companyName} — ${role} role.

${contextBlock}
${resumeBlock}

Provide:
1. A match score (0-100) BASED ON THEIR ACTUAL PERFORMANCE DATA, not generic estimates.
2. The specific skill gaps for ${companyName} given their real weak areas.
3. The exact interview process for ${companyName} (all rounds, OA, etc.).
4. A REALISTIC 2-week targeted prep timeline for this specific company.
5. Insider tips unique to ${companyName}'s hiring style.
`

    const raw = await generateText(
      COMPANY_AGENT_PROMPT,
      userMessage,
      [],
      'llama-3.3-70b-versatile'
    )

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json(
        { error: 'Could not parse company analysis. Try again.' },
        { status: 500 }
      )
    }

    let sanitized = jsonMatch[0]
    try { sanitized = jsonrepair(sanitized) } catch {}

    const result = JSON.parse(sanitized)
    return Response.json(result)
  } catch (error) {
    console.error('[Company Agent Error]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Company agent unavailable' },
      { status: 500 }
    )
  }
}
