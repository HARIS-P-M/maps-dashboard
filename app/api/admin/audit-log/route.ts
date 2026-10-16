import { requireAdmin, authErrorResponse } from '@/lib/auth/require-admin'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const url = new URL(request.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
    const pageSize = Math.min(50, Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '20', 10) || 20))
    const search = url.searchParams.get('search')?.trim() ?? ''
    const where = search
      ? {
          OR: [
            { action: { contains: search, mode: 'insensitive' as const } },
            { targetType: { contains: search, mode: 'insensitive' as const } },
            { targetId: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {}

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { admin: { select: { name: true, email: true } } },
      }),
      prisma.adminAuditLog.count({ where }),
    ])

    return Response.json({
      logs,
      pagination: { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) },
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}
