import { NextRequest } from 'next/server'
import { generateText } from '@/lib/agents/groq-client'
import { QUESTION_GENERATOR_PROMPT } from '@/lib/agents/agent-prompts'

export const runtime = 'nodejs'

export async function POST(req: NextRequest) {
  try {
    const { resumeText, jdText, targetRole } = await req.json()

    const userMessage = `
Candidate Target Role: ${targetRole || 'Software Engineer'}

Candidate Resume:
${resumeText ? `"${resumeText}"` : '(No resume provided. Ask general questions for the role)'}

Target Job Description:
${jdText ? `"${jdText}"` : '(No JD provided)'}

Please generate the mock interview questions based on the candidate's profile and target role.
`

    const raw = await generateText(
      QUESTION_GENERATOR_PROMPT,
      userMessage,
      [],
      'llama-3.1-8b-instant'
    )

    // Try to parse JSON array from model output
    const jsonMatch = raw.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      return Response.json(
        { error: 'Could not parse generated questions.' },
        { status: 500 }
      )
    }

    const result = JSON.parse(jsonMatch[0])
    return Response.json(result)
  } catch (error) {
    console.error('[Question Generator Error]', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Question generator unavailable' },
      { status: 500 }
    )
  }
}
