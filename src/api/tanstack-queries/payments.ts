import { queryOptions } from '@tanstack/react-query'
import { getPaymentsList } from '@/api/server-functions/payments'

export const PAYMENTS_QUERY_KEY = 'payments'

export const paymentsListQueryOptions = () =>
  queryOptions({
    queryKey: [PAYMENTS_QUERY_KEY],
    queryFn: async () => await getPaymentsList(),
  })
