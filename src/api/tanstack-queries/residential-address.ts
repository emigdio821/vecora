import { queryOptions } from '@tanstack/react-query'
import type { SelectResidentialAddress } from '@/db/schema/zod/residential-address'
import { getResidentialAddress } from '../server-functions/residential-address'

export const RESIDENTIAL_ADDRESS_QUERY_KEY = 'residential-address'

export const residentialAddressQueryOptions = () =>
  queryOptions({
    queryKey: [RESIDENTIAL_ADDRESS_QUERY_KEY],
    queryFn: async (): Promise<SelectResidentialAddress | null> => await getResidentialAddress(),
    staleTime: Number.POSITIVE_INFINITY,
  })
