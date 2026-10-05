import { useCurrency, useFormatCurrency } from '@/hooks/use-currency'
import type { CurrencyCode } from '@/lib/utils'

interface MoneyProps {
  value: number | string
  /** The amount's own; omit for one that has none (an area's suggested fee), which is in the current one. */
  currency?: CurrencyCode
}

/** An amount in its currency, for table cells and other markup (strings use useFormatCurrency). */
export function Money({ value, currency }: MoneyProps) {
  const home = useCurrency()
  const formatCurrency = useFormatCurrency()
  return formatCurrency(value, currency ?? home)
}
