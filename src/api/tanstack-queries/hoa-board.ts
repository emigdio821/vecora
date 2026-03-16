import { queryOptions } from '@tanstack/react-query'
import { getCurrentHoaBoardMembers, getHoaBoardPeriods } from '@/api/server-functions/hoa-board'
import type { SelectHoaBoard, SelectHoaBoardPeriod } from '@/db/schema/zod/hoa-board'
import type { SelectProfile } from '@/db/schema/zod/profiles'
import type { SelectUser } from '@/db/schema/zod/users'

export const HOA_BOARD_MEMBERS_QUERY_KEY = 'hoa-board-members'
export const HOA_BOARD_PERIODS_QUERY_KEY = 'hoa-board-periods'

export type HoaBoardPeriodQueryData = SelectHoaBoardPeriod & {
  members: (SelectHoaBoard & {
    period: SelectHoaBoardPeriod
    profile:
      | (SelectProfile & {
          user: SelectUser | null
        })
      | null
  })[]
}

export type HoaBoardMemberQueryData = SelectHoaBoard & {
  period: SelectHoaBoardPeriod
  profile:
    | (SelectProfile & {
        user: SelectUser | null
      })
    | null
}

export const hoaBoardPeriodsListQueryOptions = () =>
  queryOptions({
    queryKey: [HOA_BOARD_PERIODS_QUERY_KEY],
    queryFn: async (): Promise<HoaBoardPeriodQueryData[]> => await getHoaBoardPeriods(),
    staleTime: Number.POSITIVE_INFINITY,
  })

export const currentHoaBoardMembersQueryOptions = () =>
  queryOptions({
    queryKey: [HOA_BOARD_MEMBERS_QUERY_KEY],
    queryFn: async (): Promise<HoaBoardMemberQueryData[]> => await getCurrentHoaBoardMembers(),
    staleTime: Number.POSITIVE_INFINITY,
  })
