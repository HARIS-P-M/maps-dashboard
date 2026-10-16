import { requireAdmin, authErrorResponse } from '@/lib/auth/require-admin'
import { prisma } from '@/lib/prisma'

const defaultSettings = {
  featureFlags: {
    mockInterview: true,
    leaderboard: true,
    aptitudeLab: true,
    roadmapGenerator: true,
    advancedAnalytics: true,
    companyInsights: true,
    aiAssistant: true,
    codingArena: true,
  },
  security: {
    studentRegistration: true,
    mfaForAdmins: false,
    sessionTimeout: 60,
    maxLoginAttempts: 5,
  },
  platform: {
    maintenanceMode: false,
    registrationOpen: true,
    maxStudents: 200,
  },
} as const

async function readSettings() {
  const records = await prisma.systemSetting.findMany()
  const settings = { ...defaultSettings } as Record<string, unknown>
  for (const record of records) settings[record.key] = record.value
  return settings
}

export async function GET() {
  try {
    await requireAdmin()
    return Response.json({ settings: await readSettings() })
  } catch (error) {
    return authErrorResponse(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await requireAdmin()
    const body: unknown = await request.json()
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return Response.json({ error: 'Request body must be an object.' }, { status: 400 })
    }

    const input = body as Record<string, unknown>
    const allowedKeys = ['featureFlags', 'security', 'platform']
    const keys = Object.keys(input)
    if (keys.length === 0 || keys.some((key) => !allowedKeys.includes(key))) {
      return Response.json({ error: 'Only featureFlags, security, and platform may be updated.' }, { status: 400 })
    }

    for (const key of keys) {
      if (!input[key] || typeof input[key] !== 'object' || Array.isArray(input[key])) {
        return Response.json({ error: `Invalid ${key} settings.` }, { status: 400 })
      }
    }

    await prisma.$transaction(async (transaction) => {
      for (const key of keys) {
        await transaction.systemSetting.upsert({
          where: { key },
          update: { value: input[key] as object, updatedBy: admin.id },
          create: { key, value: input[key] as object, updatedBy: admin.id },
        })
      }
      await transaction.adminAuditLog.create({
        data: {
          adminUserId: admin.id,
          action: 'PLATFORM_SETTINGS_CHANGED',
          targetType: 'System',
          targetId: 'settings',
          metadata: { keys },
        },
      })
    })

    return Response.json({ settings: await readSettings() })
  } catch (error) {
    return authErrorResponse(error)
  }
}
