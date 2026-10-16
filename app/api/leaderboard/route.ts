import { requireCurrentUser, UnauthorizedError } from '@/lib/auth/current-user'

import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    await requireCurrentUser()

    const users = await prisma.user.findMany({
      where: { role: 'STUDENT', status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        stats: {
          select: {
            xp: true,
            streak: true,
          },
        },
      },
    })

    const sorted = users
      .map((user) => ({
        id: user.id,
        name: user.name,
        xp: user.stats?.xp ?? 0,
        streak: user.stats?.streak ?? 0,
      }))
      .sort((left, right) => right.xp - left.xp || right.streak - left.streak || left.name.localeCompare(right.name))
      .map((user, index) => ({
        ...user,
        rank: index + 1,
        delta: 0,
      }))

    return Response.json({ leaderboard: sorted })
  } catch (error) {
    if (error instanceof UnauthorizedError) {
      return Response.json({ error: error.message }, { status: 401 })
    }
    return Response.json({ error: 'Unable to load the leaderboard.' }, { status: 500 })
  }
}
