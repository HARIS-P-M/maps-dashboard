import { getCurrentUser } from '@/lib/auth/current-user'

export async function GET() {
  const user = await getCurrentUser()
  if (!user) {
    return Response.json({ user: null }, { status: 401 })
  }
  return Response.json({
    user: {
      ...user,
      username: user.name,
      role: user.role === 'ADMIN' ? 'admin' : 'user',
      stats: user.stats ?? {
        placementProb: 0,
        atsScore: 0,
        interviewReadiness: 0,
        streak: 0,
        problemsSolved: 0,
        accuracy: 0,
        mockInterviews: 0,
        activeDays: 0,
      },
    },
  })
}
