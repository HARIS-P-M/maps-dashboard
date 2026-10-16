import { prisma } from '@/lib/prisma'
import { createServerClient } from '@/lib/supabase/server'

export type CurrentUser = {
  id: string
  authUserId: string
  email: string
  name: string
  role: 'STUDENT' | 'ADMIN'
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED'
  stats: {
    placementProb: number
    atsScore: number
    interviewReadiness: number
    streak: number
    problemsSolved: number
    accuracy: number
    mockInterviews: number
    activeDays: number
  } | null
}

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createServerClient()
  const {
    data: { user: authUser },
    error,
  } = await supabase.auth.getUser()

  if (error || !authUser?.id) return null

  const user = await prisma.user.findUnique({
    where: { authUserId: authUser.id },
    select: {
      id: true,
      authUserId: true,
      email: true,
      name: true,
      role: true,
      status: true,
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
  })

  if (!user || user.status !== 'ACTIVE') return null
  return user
}

export async function requireCurrentUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) {
    throw new UnauthorizedError()
  }
  return user
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Authentication is required.')
    this.name = 'UnauthorizedError'
  }
}
