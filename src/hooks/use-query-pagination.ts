import { parseAsIndex, parseAsInteger, useQueryStates } from 'nuqs'
import { DEFAULT_TABLE_PAGE_SIZE } from '@/components/table/pagination'

export function useQueryPagination() {
  const paginationParsers = {
    pageIndex: parseAsIndex.withDefault(0),
    pageSize: parseAsInteger.withDefault(DEFAULT_TABLE_PAGE_SIZE),
  }

  const paginationUrlKeys = {
    pageIndex: 'page',
    pageSize: 'perPage',
  }

  return useQueryStates(paginationParsers, {
    urlKeys: paginationUrlKeys,
  })
}
