import { createServerFn } from '@tanstack/react-start'
import { and, eq } from 'drizzle-orm'
import { createAuditLog } from '@/api/server-functions/audit-logs'
import { db } from '@/db'
import { hoaBoard, hoaBoardPeriods } from '@/db/schema'
import type { SelectHoaBoard } from '@/db/schema/zod/hoa-board'
import { logger } from '@/lib/logger'
import { adminOnlyMiddleware } from '@/middleware/admin'
import { authMiddleware } from '@/middleware/auth'
import {
  createHoaBoardMemberSchema,
  createHoaBoardPeriodSchema,
  deleteHoaBoardMemberSchema,
  deleteHoaBoardPeriodSchema,
  updateHoaBoardMemberSchema,
  updateHoaBoardPeriodSchema,
} from '@/schemas/hoa-board'

export const getHoaBoardPeriods = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const periods = await db.query.hoaBoardPeriods.findMany({
      where: (period, { isNull }) => isNull(period.deletedAt),
      with: {
        members: {
          // where: (member, { isNull }) => isNull(member.deletedAt),
          with: {
            period: true,
            profile: {
              with: {
                user: true,
              },
            },
          },
        },
      },
      orderBy: (period, { desc }) => [desc(period.startDate)],
    })

    return periods
  })

export const getCurrentHoaBoardMembers = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const now = new Date()

    // Find the current period
    const currentPeriod = await db.query.hoaBoardPeriods.findFirst({
      where: (period, { and, lte, gte, isNull }) =>
        and(lte(period.startDate, now), gte(period.endDate, now), isNull(period.deletedAt)),
    })

    if (!currentPeriod) {
      return []
    }

    // Get members for the current period (exclude deleted members)
    const members = await db.query.hoaBoard.findMany({
      where: (board, { eq, isNull, and }) =>
        and(eq(board.periodId, currentPeriod.id), isNull(board.deletedAt)),
      with: {
        period: true,
        profile: {
          with: {
            user: true,
          },
        },
      },
    })

    return members
  })

export const createHoaBoardPeriod = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(createHoaBoardPeriodSchema)
  .handler(async ({ data }) => {
    const existingPeriods = await db.query.hoaBoardPeriods.findMany({
      where: (period, { isNull }) => isNull(period.deletedAt),
    })

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
    }).catch(logger.error)

    return newPeriod
  })

export const updateHoaBoardPeriod = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(updateHoaBoardPeriodSchema)
  .handler(async ({ data }) => {
    const { periodId, ...updateData } = data

    // Check for overlap with other periods (excluding the current one)
    const existingPeriods = await db.query.hoaBoardPeriods.findMany({
      where: (period, { isNull, ne, and }) => and(isNull(period.deletedAt), ne(period.id, periodId)),
    })

    const hasOverlap = existingPeriods.some((period) => {
      return updateData.startDate < period.endDate && updateData.endDate > period.startDate
    })

    if (hasOverlap) {
      throw new Error('Overlap detected with existing HOA board periods')
    }

    const [oldPeriod] = await db
      .select()
      .from(hoaBoardPeriods)
      .where(eq(hoaBoardPeriods.id, periodId))
      .limit(1)

    if (!oldPeriod) {
      throw new Error('Period not found')
    }

    const [updatedPeriod] = await db
      .update(hoaBoardPeriods)
      .set({
        startDate: updateData.startDate,
        endDate: updateData.endDate,
      })
      .where(eq(hoaBoardPeriods.id, periodId))
      .returning()

    createAuditLog({
      data: {
        action: 'update',
        entityType: 'hoa_board_period',
        entityId: updatedPeriod.id,
        oldData: oldPeriod,
        newData: updatedPeriod,
      },
    }).catch(logger.error)

    return updatedPeriod
  })

export const createHoaBoardMember = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(createHoaBoardMemberSchema)
  .handler(async ({ data }) => {
    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.id, data.profileId),
      with: {
        resident: true,
        user: true,
      },
    })

    if (!profile || !profile.resident) {
      throw new Error('Profile or resident not found')
    }

    const { firstName, lastName, email, phone, isOwner } = profile.resident
    const role = profile.user?.role ?? null

    // Check if a soft-deleted member already exists for this profile and period
    const [existingMember] = await db
      .select()
      .from(hoaBoard)
      .where(and(eq(hoaBoard.periodId, data.periodId), eq(hoaBoard.profileId, data.profileId)))
      .limit(1)

    let member: SelectHoaBoard

    if (existingMember?.deletedAt) {
      // Restore the soft-deleted member and update their info
      const [restoredMember] = await db
        .update(hoaBoard)
        .set({
          deletedAt: null,
          firstName,
          lastName,
          email,
          phone,
          role,
          isOwner,
        })
        .where(eq(hoaBoard.id, existingMember.id))
        .returning()

      member = restoredMember

      createAuditLog({
        data: {
          action: 'update',
          entityType: 'hoa_board',
          entityId: member.id,
          oldData: existingMember,
          newData: restoredMember,
        },
      }).catch(logger.error)
    } else if (existingMember) {
      // Member already exists and is not deleted
      throw new Error('Member already exists in this period')
    } else {
      // Create new member
      const [newMember] = await db
        .insert(hoaBoard)
        .values({
          periodId: data.periodId,
          profileId: data.profileId,
          firstName,
          lastName,
          email,
          phone,
          role,
          isOwner,
        })
        .returning()

      member = newMember

      createAuditLog({
        data: {
          action: 'create',
          entityType: 'hoa_board',
          entityId: member.id,
          newData: newMember,
        },
      }).catch(logger.error)
    }

    return member
  })

export const updateHoaBoardMember = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(updateHoaBoardMemberSchema)
  .handler(async ({ data }) => {
    const { memberId, ...updateData } = data

    const profile = await db.query.profiles.findFirst({
      where: (profiles, { eq }) => eq(profiles.id, updateData.profileId),
      with: {
        resident: true,
        user: true,
      },
    })

    if (!profile || !profile.resident) {
      throw new Error('Profile or resident not found')
    }

    const { firstName, lastName, email, phone, isOwner } = profile.resident
    const role = profile.user?.role ?? null

    const [oldMember] = await db.select().from(hoaBoard).where(eq(hoaBoard.id, memberId)).limit(1)

    const [updatedMember] = await db
      .update(hoaBoard)
      .set({
        periodId: updateData.periodId,
        profileId: updateData.profileId,
        firstName,
        lastName,
        email,
        phone,
        role,
        isOwner,
      })
      .where(eq(hoaBoard.id, memberId))
      .returning()

    createAuditLog({
      data: {
        action: 'update',
        entityType: 'hoa_board',
        entityId: updatedMember.id,
        oldData: oldMember,
        newData: updatedMember,
      },
    }).catch(logger.error)

    return updatedMember
  })

export const deleteHoaBoardMember = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(deleteHoaBoardMemberSchema)
  .handler(async ({ data }) => {
    const [memberToDelete] = await db.select().from(hoaBoard).where(eq(hoaBoard.id, data.memberId)).limit(1)

    // Soft delete: set deletedAt timestamp instead of removing record
    const [deletedMember] = await db
      .update(hoaBoard)
      .set({ deletedAt: new Date() })
      .where(eq(hoaBoard.id, data.memberId))
      .returning()

    createAuditLog({
      data: {
        action: 'delete',
        entityType: 'hoa_board',
        entityId: deletedMember.id,
        oldData: memberToDelete,
      },
    }).catch(logger.error)

    return memberToDelete
  })

export const deleteHoaBoardPeriod = createServerFn({ method: 'POST' })
  .middleware([authMiddleware, adminOnlyMiddleware])
  .inputValidator(deleteHoaBoardPeriodSchema)
  .handler(async ({ data }) => {
    const [periodToDelete] = await db
      .select()
      .from(hoaBoardPeriods)
      .where(eq(hoaBoardPeriods.id, data.periodId))
      .limit(1)

    if (!periodToDelete) {
      throw new Error('Period not found')
    }

    // Soft delete: set deletedAt timestamp instead of removing record
    const [deletedPeriod] = await db
      .update(hoaBoardPeriods)
      .set({ deletedAt: new Date() })
      .where(eq(hoaBoardPeriods.id, data.periodId))
      .returning()

    // Also soft delete all members in this period
    await db.update(hoaBoard).set({ deletedAt: new Date() }).where(eq(hoaBoard.periodId, data.periodId))

    createAuditLog({
      data: {
        action: 'delete',
        entityType: 'hoa_board_period',
        entityId: deletedPeriod.id,
        oldData: periodToDelete,
      },
    }).catch(logger.error)

    return periodToDelete
  })
