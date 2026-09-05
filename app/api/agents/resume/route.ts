// app/api/agents/resume/route.ts
// Resume Agent — ATS analysis and optimization

import { NextRequest } from 'next/server'
import { generateText } from '@/lib/agents/groq-client'
import { RESUME_AGENT_PROMPT } from '@/lib/agents/agent-prompts'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { resumeText, targetRole, targetCompany, jdText } = await req.json()

    if (!resumeText || typeof resumeText !== 'string') {
      return Response.json({ error: 'resumeText is required' }, { status: 400 })
    }

    let userMessage = `
Please analyze this resume for a ${targetRole ?? 'Software Engineer'} role${targetCompany ? ` at ${targetCompany}` : ''}.

RESUME:
${resumeText}
`
    if (jdText && typeof jdText === 'string' && jdText.trim().length > 0) {
      userMessage += `\n\nJOB DESCRIPTION:\n${jdText}`
    }

    const raw = await generateText(
      RESUME_AGENT_PROMPT,
      userMessage,
      [],
      'llama-3.1-8b-instant'
    )

    // Try to parse JSON from model output
    const jsonMatch = raw.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return Response.json(
        { error: 'Could not parse resume analysis. Try again.' },
        { status: 500 }
      )
    }

    const result = JSON.parse(jsonMatch[0])
    return Response.json(result)
  } catch (error) {
    console.error('[Resume Agent Error]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Resume agent unavailable' },
      { status: 500 }
    )
  }
}
