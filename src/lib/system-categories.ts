import { m } from '@/paraglide/messages'

/**
 * Where the rows of each system category (transaction_categories.key) come
 * from. Those rows are never typed into Transactions by hand.
 */
const SYSTEM_CATEGORY_SOURCE: Record<string, () => string> = {
  fee: m.treasury_source_record_fee,
  late_fee: m.treasury_source_record_fee,
  amenity_fee: m.treasury_source_reservations,
  amenity_refund: m.treasury_source_reservations,
}

export function systemCategorySource(key: string): string {
  return (SYSTEM_CATEGORY_SOURCE[key] ?? m.treasury_source_record_fee)()
}
