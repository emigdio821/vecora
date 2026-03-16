import { queryOptions } from '@tanstack/react-query'
import { getPaymentsByYear, getPaymentsList } from '@/api/server-functions/payments'
import type { SelectPayment, SelectPaymentMonth } from '@/db/schema/zod/payments'
import type { SelectResident } from '@/db/schema/zod/residents'

export const PAYMENTS_QUERY_KEY = 'payments'

export type PaymentQueryData = SelectPayment & {
  resident: SelectResident | null
  paymentMonths: SelectPaymentMonth[]
}

export const paymentsListQueryOptions = () =>
  queryOptions({
    queryKey: [PAYMENTS_QUERY_KEY],
    queryFn: async (): Promise<PaymentQueryData[]> => await getPaymentsList(),
  })

export const paymentsByYearQueryOptions = (year: number) =>
  queryOptions({
    queryKey: [PAYMENTS_QUERY_KEY, year],
    queryFn: async (): Promise<PaymentQueryData[]> => await getPaymentsByYear({ data: { year } }),
  })
