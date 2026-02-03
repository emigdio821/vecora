import { queryOptions } from '@tanstack/react-query'
import { getCurrentHoaBoardMembers, getHoaBoardPeriods } from '@/api/server-functions/hoa-board'

export const HOA_BOARD_MEMBERS_QUERY_KEY = 'hoa-board-members'
export const HOA_BOARD_PERIODS_QUERY_KEY = 'hoa-board-periods'

export const hoaBoardPeriodsListQueryOptions = () =>
  queryOptions({
    queryKey: [HOA_BOARD_PERIODS_QUERY_KEY],
    queryFn: async () => await getHoaBoardPeriods(),
    staleTime: Number.POSITIVE_INFINITY,
  })

export const currentHoaBoardMembersQueryOptions = () =>
  queryOptions({
    queryKey: [HOA_BOARD_MEMBERS_QUERY_KEY],
    queryFn: async () => await getCurrentHoaBoardMembers(),
    staleTime: Number.POSITIVE_INFINITY,
  })
