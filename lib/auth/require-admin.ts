import {
  requireCurrentUser,
  UnauthorizedError,
  type CurrentUser,
} from '@/lib/auth/current-user'

export class ForbiddenError extends Error {
  constructor() {
    super('Administrator privileges are required.')
    this.name = 'ForbiddenError'
  }
}

export async function requireAdmin(): Promise<CurrentUser> {
  let user: CurrentUser
  try {
    user = await requireCurrentUser()
  } catch (error) {
    if (error instanceof UnauthorizedError) throw error
    throw error
  }

  if (user.role !== 'ADMIN') throw new ForbiddenError()
  return user
}

export function authErrorResponse(error: unknown): Response {
  if (error instanceof UnauthorizedError) {
    return Response.json({ error: error.message }, { status: 401 })
  }
  if (error instanceof ForbiddenError) {
    return Response.json({ error: error.message }, { status: 403 })
  }
  return Response.json({ error: 'Unable to authorize this request.' }, { status: 500 })
}
