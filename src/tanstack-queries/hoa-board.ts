import { queryOptions } from '@tanstack/react-query'
import { fetchBoardMembers } from '@/server-actions/hoa-board'

export const HOA_BOARD_QUERY_KEY = 'hoa-board'

export type BoardMemberQueryData = Awaited<ReturnType<typeof fetchBoardMembers>>[number]

export const boardMembersQueryOptions = queryOptions({
  queryKey: [HOA_BOARD_QUERY_KEY, 'members'],
  queryFn: () => fetchBoardMembers(),
})
