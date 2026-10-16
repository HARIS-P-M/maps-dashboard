import { requireAdmin, authErrorResponse } from '@/lib/auth/require-admin'
import { prisma } from '@/lib/prisma'

const audiences = ['ALL_STUDENTS', 'ACTIVE_STUDENTS', 'ADMINS'] as const

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json({ error: 'Request body must be an object.' }, { status: 400 })
    }

    const input = body as Record<string, unknown>
    const message = input.message
    const audience = input.audience ?? 'ALL_STUDENTS'
    if (
      typeof message !== 'string' ||
      message.trim().length < 1 ||
      message.length > 2000 ||
      typeof audience !== 'string' ||
      !audiences.includes(audience as (typeof audiences)[number])
    ) {
      return Response.json({ error: 'A message and valid audience are required.' }, { status: 400 })
    }

    const announcement = await prisma.$transaction(async (transaction) => {
      const created = await transaction.announcement.create({
        data: {
          message: message.trim(),
          audience: audience as (typeof audiences)[number],
          createdBy: admin.id,
          publishedAt: new Date(),
        },
      })

      const users = await transaction.user.findMany({
        where:
          audience === 'ADMINS'
            ? { role: 'ADMIN', status: 'ACTIVE' }
            : audience === 'ACTIVE_STUDENTS'
              ? { role: 'STUDENT', status: 'ACTIVE' }
              : { status: 'ACTIVE' },
        select: { id: true },
      })

      if (users.length > 0) {
        await transaction.notification.createMany({
          data: users.map(({ id }) => ({
            userId: id,
            agentName: 'Admin',
            message: message.trim(),
            type: 'INFO' as const,
          })),
        })
      }

      await transaction.adminAuditLog.create({
        data: {
          adminUserId: admin.id,
          action: 'ANNOUNCEMENT_SENT',
          targetType: 'Platform',
          targetId: created.id,
          metadata: { audience, recipientCount: users.length },
        },
      })

      return created
    })

    return Response.json({ announcement }, { status: 201 })
  } catch (error) {
    return authErrorResponse(error)
  }
}
