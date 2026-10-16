import { requireAdmin, authErrorResponse } from '@/lib/auth/require-admin'
import { prisma } from '@/lib/prisma'

const agentDefaults = [
  ['ORCHESTRATOR', 'openai/gpt-oss-20b', 0.2, 1024],
  ['RESUME', 'openai/gpt-oss-120b', 0.2, 4096],
  ['CODING', 'openai/gpt-oss-120b', 0.2, 4096],
  ['APTITUDE', 'openai/gpt-oss-20b', 0.4, 2048],
  ['INTERVIEW', 'openai/gpt-oss-120b', 0.3, 4096],
  ['COMPANY', 'openai/gpt-oss-120b', 0.2, 4096],
  ['COACH', 'openai/gpt-oss-120b', 0.3, 4096],
  ['QUESTION_GENERATOR', 'openai/gpt-oss-20b', 0.5, 2048],
  ['PROBLEM_GENERATOR', 'openai/gpt-oss-120b', 0.4, 4096],
] as const

export async function GET() {
  try {
    const admin = await requireAdmin()
    await Promise.all(
      agentDefaults.map(([agentName, model, temperature, maxTokens]) =>
        prisma.agentConfig.upsert({
          where: { agentName },
          update: {},
          create: { agentName, model, temperature, maxTokens, updatedBy: admin.id },
        })
      )
    )

    const agents = await prisma.agentConfig.findMany({ orderBy: { agentName: 'asc' } })
    return Response.json({ agents })
  } catch (error) {
    return authErrorResponse(error)
  }
}
