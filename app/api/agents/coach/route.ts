// app/api/agents/coach/route.ts
// Coach Agent — personalized roadmap with FULL student intelligence context

import { NextRequest } from 'next/server'
import { generateText } from '@/lib/agents/groq-client'
import { COACH_AGENT_PROMPT } from '@/lib/agents/agent-prompts'
import { jsonrepair } from 'jsonrepair'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const {
      resumeText,
      jdText,
      targetRole = 'Software Engineer',
      targetCompany = 'a tech company',
      targetDate = '3 months from now',
      weeksToGenerate = 4,
      studentContext,     // ← NEW: full intelligence snapshot from store
    } = await req.json()

    // Build a rich context summary for the Coach
    const contextSummary = studentContext ? `
STUDENT PERFORMANCE SNAPSHOT (Real data from platform activity):
- Resume ATS Score: ${studentContext.resumeScore}/100
- JD Match Score: ${studentContext.jdMatchScore != null ? `${studentContext.jdMatchScore}/100` : 'No JD uploaded'}
- Resume Keyword Gaps: ${studentContext.keywordGaps?.slice(0, 6).join(', ') || 'None detected'}
- Aptitude Accuracy by Topic: ${Object.entries(studentContext.aptitudeAccuracy || {}).map(([t, a]) => `${t}: ${a}%`).join(', ') || 'No practice yet'}
- Weak Aptitude Topics (< 50% accuracy): ${studentContext.aptitudeWeakTopics?.join(', ') || 'None yet'}
- Interview Average Score: ${studentContext.interviewAvgScore?.toFixed(1) ?? '0'}/10
- Coding Problems Attempted: ${studentContext.codingProblemsAttempted ?? 0}
- Coding Success Rate: ${studentContext.codingSuccessRate ?? 0}%
- DSA Topics Covered: ${studentContext.codingTopicsCovered?.join(', ') || 'None yet'}
- Overall Placement Probability: ${studentContext.placementProbability ?? 0}%
` : '(No performance data available — generate a balanced plan)'

    const userMessage = `
Generate a personalized placement prep plan for this student.

TARGET ROLE: ${targetRole}
TARGET COMPANY: ${targetCompany}
TARGET DATE: ${targetDate}
WEEKS TO PLAN: ${weeksToGenerate}

${contextSummary}

STUDENT RESUME:
${resumeText ? `"${resumeText.slice(0, 3000)}"` : '(No resume provided. Generate a generic CS student plan)'}

TARGET JOB DESCRIPTION:
${jdText ? `"${jdText.slice(0, 2000)}"` : '(No JD provided. Target general SDE-1 requirements)'}

IMPORTANT INSTRUCTIONS:
1. Base the priority areas on their ACTUAL weak scores above, not generic advice.
2. If aptitude accuracy < 50% on any topic, prioritize that topic heavily in week 1.
3. If coding success rate < 60%, prioritize easy-medium DSA problems.
4. If interview score < 6/10, include mock interview practice every week.
5. If resume score < 70, include a resume improvement task in week 1.
6. The plan must be SPECIFICALLY tailored to ${targetCompany}'s known interview style.
`

    const raw = await generateText(
      COACH_AGENT_PROMPT,
      userMessage,
      [],
      'llama-3.3-70b-versatile'   // Use stronger model for the main coaching plan
    )

    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json({ error: 'Could not parse coach plan. Try again.' }, { status: 500 })
    }

    let sanitized = jsonMatch[0]
    try { sanitized = jsonrepair(sanitized) } catch {}

    const result = JSON.parse(sanitized)
    return Response.json(result)
  } catch (error) {
    console.error('[Coach Agent Error]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Coach agent unavailable' },
      { status: 500 }
    )
  }
}
