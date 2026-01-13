import { queryOptions } from '@tanstack/react-query'
import axios from 'axios'
import type { OwnerWithRelations } from '@/db/schemas/zod'

export const OWNERS_QUERY_KEY = 'owners'

export const ownersListQueryOptions = () =>
  queryOptions({
    queryKey: [OWNERS_QUERY_KEY],
    queryFn: async () => {
      const { data } = await axios.get<OwnerWithRelations[]>('/api/owners')
      return data
    },
  })
