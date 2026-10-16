import { requireAdmin, authErrorResponse } from '@/lib/auth/require-admin'
import { prisma } from '@/lib/prisma'
import { createServiceRoleClient } from '@/lib/supabase/server'

const MAX_PAGE_SIZE = 50

export async function POST(request: Request) {
  try {
    const admin = await requireAdmin()
    const body: unknown = await request.json()

    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json({ error: 'Request body must be an object.' }, { status: 400 })
    }

    const input = body as Record<string, unknown>
    const name = typeof input.name === 'string' ? input.name.trim() : ''
    const email = typeof input.email === 'string' ? input.email.trim().toLowerCase() : ''
    const password = typeof input.password === 'string' ? input.password : ''
    const branch = typeof input.branch === 'string' ? input.branch.trim() : ''
    const year = typeof input.year === 'string' ? input.year.trim() : ''

    if (name.length < 2 || name.length > 120) {
      return Response.json({ error: 'Name must be between 2 and 120 characters.' }, { status: 400 })
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return Response.json({ error: 'Enter a valid email address.' }, { status: 400 })
    }
    if (password.length < 8 || password.length > 72) {
      return Response.json({ error: 'Password must be between 8 and 72 characters.' }, { status: 400 })
    }
    if (branch.length > 40 || year.length > 20) {
      return Response.json({ error: 'Branch or year is too long.' }, { status: 400 })
    }

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email }, { authUserId: email }] },
      select: { id: true },
    })
    if (existing) return Response.json({ error: 'A student with this email already exists.' }, { status: 409 })

    const supabase = createServiceRoleClient()
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role: 'student' },
    })
    if (authError || !authData.user) {
      return Response.json({ error: authError?.message || 'Unable to create the student login.' }, { status: 400 })
    }

    try {
      const created = await prisma.$transaction(async (transaction) => {
        const student = await transaction.user.create({
          data: {
            authUserId: authData.user.id,
            email,
            name,
            role: 'STUDENT',
            status: 'ACTIVE',
            stats: { create: {} },
            ...(branch || year
              ? {
                  targetProfile: {
                    create: {
                      targetRole: 'Undeclared',
                      branch: branch || null,
                      graduationYear: year ? Number.parseInt(year.replace(/\D/g, ''), 10) || null : null,
                    },
                  },
                }
              : {}),
          },
          select: { id: true, email: true, name: true, status: true, createdAt: true },
        })
        await transaction.adminAuditLog.create({
          data: {
            adminUserId: admin.id,
            action: 'STUDENT_CREATED',
            targetType: 'User',
            targetId: student.id,
            metadata: { branch, year },
          },
        })
        return student
      })

      return Response.json({ user: created }, { status: 201 })
    } catch (error) {
      await supabase.auth.admin.deleteUser(authData.user.id)
      throw error
    }
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function GET(request: Request) {
  try {
    await requireAdmin()
    const url = new URL(request.url)
    const page = Math.max(1, Number.parseInt(url.searchParams.get('page') ?? '1', 10) || 1)
    const pageSize = Math.min(
      MAX_PAGE_SIZE,
      Math.max(1, Number.parseInt(url.searchParams.get('pageSize') ?? '20', 10) || 20)
    )
    const search = url.searchParams.get('search')?.trim() ?? ''
    const status = url.searchParams.get('status')
    const validStatuses = ['ACTIVE', 'SUSPENDED', 'DELETED'] as const
    const statusFilter = validStatuses.includes(status as (typeof validStatuses)[number])
      ? (status as (typeof validStatuses)[number])
      : undefined

    const where = {
      role: 'STUDENT' as const,
      ...(statusFilter ? { status: statusFilter } : { status: { not: 'DELETED' as const } }),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' as const } },
              { email: { contains: search, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          email: true,
          name: true,
          status: true,
          createdAt: true,
          stats: {
            select: {
              placementProb: true,
              atsScore: true,
              interviewReadiness: true,
              streak: true,
              problemsSolved: true,
              accuracy: true,
              mockInterviews: true,
              activeDays: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ])

    return Response.json({
      users,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}
