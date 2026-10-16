import { requireAdmin, authErrorResponse } from '@/lib/auth/require-admin'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await requireAdmin()

    const [totalUsers, activeUsers, suspendedUsers, stats] = await Promise.all([
      prisma.user.count({ where: { role: 'STUDENT', status: { not: 'DELETED' } } }),
      prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
      prisma.user.count({ where: { role: 'STUDENT', status: 'SUSPENDED' } }),
      prisma.userStats.aggregate({
        where: { user: { role: 'STUDENT', status: { not: 'DELETED' } } },
        _avg: {
          placementProb: true,
          atsScore: true,
          interviewReadiness: true,
          accuracy: true,
        },
        _sum: {
          problemsSolved: true,
          mockInterviews: true,
        },
      }),
    ])

    return Response.json({
      totalUsers,
      activeUsers,
      suspendedUsers,
      averages: stats._avg,
      totals: stats._sum,
      generatedAt: new Date().toISOString(),
    })
  } catch (error) {
    return authErrorResponse(error)
  }
}
