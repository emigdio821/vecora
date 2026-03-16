import { queryOptions } from '@tanstack/react-query'
import { getResidents } from '@/api/server-functions/residents'
import type { SelectHouse } from '@/db/schema/zod/houses'
import type { SelectPayment } from '@/db/schema/zod/payments'
import type { SelectProfile } from '@/db/schema/zod/profiles'
import type { SelectResident } from '@/db/schema/zod/residents'
import type { SelectUser } from '@/db/schema/zod/users'
import type { SelectViolation } from '@/db/schema/zod/violations'

export const RESIDENTS_QUERY_KEY = 'residents'

export type ResidentQueryData = SelectResident & {
  houses: SelectHouse[]
  violations: SelectViolation[]
  payments: SelectPayment[]
  profile: SelectProfile & {
    user: SelectUser | null
  }
}

export const residentsListQueryOptions = () =>
  queryOptions({
    queryKey: [RESIDENTS_QUERY_KEY],
    queryFn: async (): Promise<ResidentQueryData[]> => await getResidents(),
    staleTime: Number.POSITIVE_INFINITY,
  })
