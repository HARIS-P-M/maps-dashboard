import { requireAdmin, authErrorResponse } from '@/lib/auth/require-admin'
import { prisma } from '@/lib/prisma'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: Request, context: RouteContext) {
  try {
    await requireAdmin()
    const { id } = await context.params
    const user = await prisma.user.findFirst({
      where: { id, role: 'STUDENT', status: { not: 'DELETED' } },
      select: {
        id: true,
        email: true,
        name: true,
        status: true,
        createdAt: true,
        stats: true,
        targetProfile: true,
        resumes: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, originalFilename: true, createdAt: true, updatedAt: true },
        },
        codingAttempts: { orderBy: { createdAt: 'desc' }, take: 10 },
        aptitudeAttempts: { orderBy: { createdAt: 'desc' }, take: 10 },
        interviewSessions: {
          orderBy: { startedAt: 'desc' },
          take: 10,
          include: { evaluations: true },
        },
        roadmapItems: { orderBy: { order: 'asc' } },
      },
    })

    if (!user) return Response.json({ error: 'Student not found.' }, { status: 404 })
    return Response.json({ user })
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin()
    const { id } = await context.params
    const body: unknown = await request.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json({ error: 'Request body must be an object.' }, { status: 400 })
    }

    const input = body as Record<string, unknown>
    const allowedStatuses = ['ACTIVE', 'SUSPENDED'] as const
    const status = input.status
    const name = input.name

    if (
      (status !== undefined &&
        (typeof status !== 'string' ||
          !allowedStatuses.includes(status as (typeof allowedStatuses)[number]))) ||
      (name !== undefined && (typeof name !== 'string' || name.trim().length < 2 || name.length > 120))
    ) {
      return Response.json({ error: 'Only a valid name or account status may be updated.' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({ where: { id, role: 'STUDENT' } })
    if (!existing || existing.status === 'DELETED') {
      return Response.json({ error: 'Student not found.' }, { status: 404 })
    }

    const updated = await prisma.$transaction(async (transaction) => {
      const student = await transaction.user.update({
        where: { id },
        data: {
          ...(typeof name === 'string' ? { name: name.trim() } : {}),
          ...(typeof status === 'string' ? { status: status as 'ACTIVE' | 'SUSPENDED' } : {}),
        },
        select: { id: true, email: true, name: true, status: true },
      })
      await transaction.adminAuditLog.create({
        data: {
          adminUserId: admin.id,
          action: status === 'SUSPENDED' ? 'USER_SUSPENDED' : status === 'ACTIVE' ? 'USER_REACTIVATED' : 'STUDENT_UPDATED',
          targetType: 'User',
          targetId: id,
          metadata: { fields: Object.keys(input) },
        },
      })
      return student
    })

    return Response.json({ user: updated })
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const admin = await requireAdmin()
    const { id } = await context.params
    const body: unknown = await request.json().catch(() => null)
    const confirmed =
      typeof body === 'object' &&
      body !== null &&
      !Array.isArray(body) &&
      (body as Record<string, unknown>).confirmation === 'DELETE'

    if (!confirmed) {
      return Response.json({ error: 'Explicit confirmation is required.' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({ where: { id, role: 'STUDENT' } })
    if (!existing || existing.status === 'DELETED') {
      return Response.json({ error: 'Student not found.' }, { status: 404 })
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { status: 'DELETED', email: `deleted+${id}@invalid.local` } }),
      prisma.adminAuditLog.create({
        data: {
          adminUserId: admin.id,
          action: 'USER_DELETED',
          targetType: 'User',
          targetId: id,
          metadata: { strategy: 'soft-delete' },
        },
      }),
    ])

    return Response.json({ deleted: true })
  } catch (error) {
    return authErrorResponse(error)
  }
}
