import { requireAdmin, authErrorResponse } from '@/lib/auth/require-admin'
import { prisma } from '@/lib/prisma'

const allowedAgents = [
  'ORCHESTRATOR',
  'RESUME',
  'CODING',
  'APTITUDE',
  'INTERVIEW',
  'COMPANY',
  'COACH',
  'QUESTION_GENERATOR',
  'PROBLEM_GENERATOR',
] as const

type Context = { params: Promise<{ agentName: string }> }

export async function PATCH(request: Request, context: Context) {
  try {
    const admin = await requireAdmin()
    const { agentName: rawAgentName } = await context.params
    const agentName = rawAgentName.toUpperCase()
    if (!allowedAgents.includes(agentName as (typeof allowedAgents)[number])) {
      return Response.json({ error: 'Unknown agent.' }, { status: 404 })
    }

    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json({ error: 'Request body must be an object.' }, { status: 400 })
    }

    const input = body as Record<string, unknown>
    const enabled = input.enabled
    const model = input.model
    const temperature = input.temperature
    const maxTokens = input.maxTokens
    if (
      (enabled !== undefined && typeof enabled !== 'boolean') ||
      (model !== undefined && (typeof model !== 'string' || model.length < 1 || model.length > 120)) ||
      (temperature !== undefined && (typeof temperature !== 'number' || temperature < 0 || temperature > 1)) ||
      (maxTokens !== undefined && (typeof maxTokens !== 'number' || !Number.isInteger(maxTokens) || maxTokens < 256 || maxTokens > 8192))
    ) {
      return Response.json({ error: 'Invalid agent configuration values.' }, { status: 400 })
    }

    const updated = await prisma.$transaction(async (transaction) => {
      const agent = await transaction.agentConfig.update({
        where: { agentName: agentName as (typeof allowedAgents)[number] },
        data: {
          ...(typeof enabled === 'boolean' ? { enabled } : {}),
          ...(typeof model === 'string' ? { model } : {}),
          ...(typeof temperature === 'number' ? { temperature } : {}),
          ...(typeof maxTokens === 'number' ? { maxTokens } : {}),
          updatedBy: admin.id,
        },
      })
      await transaction.adminAuditLog.create({
        data: {
          adminUserId: admin.id,
          action: 'AGENT_CONFIG_CHANGED',
          targetType: 'Agent',
          targetId: agentName,
          metadata: { fields: Object.keys(input) },
        },
      })
      return agent
    })

    return Response.json({ agent: updated })
  } catch (error) {
    return authErrorResponse(error)
  }
}
