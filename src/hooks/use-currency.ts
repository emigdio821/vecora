import { useSuspenseQuery } from '@tanstack/react-query'
import { type CurrencyCode, formatCurrency } from '@/lib/utils'
import { settingsQueryOptions } from '@/tanstack-queries/session'

/** The HOA's current currency: what new amounts are recorded in. Only inside the authed layout, which loads settings. */
export function useCurrency(): CurrencyCode {
  return useSuspenseQuery(settingsQueryOptions).data.currency
}

/** formatCurrency against the current currency: an amount in another one shows its code ("$500.00 MXN"). */
export function useFormatCurrency(): (value: number | string, currency: CurrencyCode) => string {
  const home = useCurrency()
  return (value, currency) => formatCurrency(value, currency, { home })
}
