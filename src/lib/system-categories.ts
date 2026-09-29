/**
 * Where the rows of each system category (transaction_categories.key) come
 * from. Those rows are never typed into "Movimientos" by hand.
 */
const SYSTEM_CATEGORY_SOURCE: Record<string, string> = {
  fee: '"Registrar cuota"',
  late_fee: '"Registrar cuota"',
  hall_rent: '"Presidencia" - "Terraza"',
  hall_refund: '"Presidencia" - "Terraza"',
}

export function systemCategorySource(key: string): string {
  return SYSTEM_CATEGORY_SOURCE[key] ?? '"Registrar cuota"'
}
