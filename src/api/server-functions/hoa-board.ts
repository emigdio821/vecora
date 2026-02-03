import { createServerFn } from '@tanstack/react-start'
import { createAuditLog } from '@/api/server-functions/audit-logs'
import { db } from '@/db'
import { hoaBoard, hoaBoardPeriods } from '@/db/schemas/main'
import type {
  HoaBoardMemberWithProfile,
  HoaBoardPeriodWithMembers,
  SelectHoaBoard,
  SelectHoaBoardPeriod,
} from '@/db/schemas/zod/hoa-board'
import { adminOnlyMiddleware } from '@/middleware/admin'
import { authMiddleware } from '@/middleware/auth'
import { createHoaBoardMemberSchema, createHoaBoardPeriodSchema } from '@/schemas/hoa-board'

export const getHoaBoardPeriods = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const periods = await db.query.hoaBoardPeriods.findMany({
      with: {
        members: {
          with: {
            profile: {
              with: {
                profileRoles: {
                  with: {
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: (period, { desc }) => [desc(period.startDate)],
    })

    return periods satisfies HoaBoardPeriodWithMembers[]
  })

export const getCurrentHoaBoardMembers = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const now = new Date()

    // Find the current period
    const currentPeriod = await db.query.hoaBoardPeriods.findFirst({
      where: (period, { and, lte, gte }) => and(lte(period.startDate, now), gte(period.endDate, now)),
    })

    if (!currentPeriod) {
      return []
    }

    // Get members for the current period
    const members = await db.query.hoaBoard.findMany({
      where: (board, { eq }) => eq(board.periodId, currentPeriod.id),
      with: {
        profile: {
          with: {
            profileRoles: {
              with: {
                role: true,
              },
            },
          },
        },
      },
    })

    return members satisfies HoaBoardMemberWithProfile[]
  })

export const createHoaBoardPeriod = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(createHoaBoardPeriodSchema)
  .handler(async ({ data }) => {
    const existingPeriods = await db.query.hoaBoardPeriods.findMany()

    const hasOverlap = existingPeriods.some((period) => {
      return data.startDate < period.endDate && data.endDate > period.startDate
    })

    if (hasOverlap) {
      throw new Error('Overlap detected with existing HOA board periods')
    }

    const [newPeriod] = await db
      .insert(hoaBoardPeriods)
      .values({
        startDate: data.startDate,
        endDate: data.endDate,
      })
      .returning()

    createAuditLog({
      data: {
        action: 'create',
        entityType: 'hoa_board_period',
        entityId: newPeriod.id,
        newData: newPeriod,
      },
    }).catch(console.error)

    return newPeriod satisfies SelectHoaBoardPeriod
  })

export const createHoaBoardMember = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(createHoaBoardMemberSchema)
  .handler(async ({ data }) => {
    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.id, data.profileId),
      with: {
        owner: true,
        externalUser: true,
      },
    })

    if (!profile) {
      throw new Error('Perfil no encontrado')
    }

    let firstName: string
    let lastName: string
    let email: string

    if (profile.profileType === 'owner' && profile.owner) {
      firstName = profile.owner.firstName
      lastName = profile.owner.lastName
      email = profile.owner.email
    } else if (profile.profileType === 'external' && profile.externalUser) {
      firstName = profile.externalUser.firstName
      lastName = profile.externalUser.lastName
      email = profile.externalUser.email
    } else {
      throw new Error('No se pudo determinar la información del perfil')
    }

    const [newMember] = await db
      .insert(hoaBoard)
      .values({
        periodId: data.periodId,
        profileId: data.profileId,
        firstName,
        lastName,
        email,
        profileType: profile.profileType,
      })
      .returning()

    createAuditLog({
      data: {
        action: 'create',
        entityType: 'hoa_board',
        entityId: newMember.id,
        newData: newMember,
      },
    }).catch(console.error)

    return newMember satisfies SelectHoaBoard
  })
