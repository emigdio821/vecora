import { createServerFn } from '@tanstack/react-start'
import { db } from '@/db'
import type { HoaBoardMemberWithProfile, HoaBoardPeriodWithMembers } from '@/db/schemas/zod/hoa-board'
import { authMiddleware } from '@/middleware/auth'

export const getHoaBoardPeriods = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const periods = await db.query.hoaBoardPeriods.findMany({
      with: {
        members: {
          with: {
            profile: true,
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
        profile: true,
      },
    })

    return members satisfies HoaBoardMemberWithProfile[]
  })
