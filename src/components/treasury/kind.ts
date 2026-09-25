import type { Database } from '@/lib/supabase/database.types'

export type TransactionKind = Database['public']['Enums']['transaction_kind']
export type PaymentMethod = Database['public']['Enums']['payment_method']

export const KIND_LABEL: Record<TransactionKind, string> = {
  income: 'Ingreso',
  expense: 'Egreso',
}

/** Options for kind toggles, in display order. */
export const KIND_ITEMS: { value: TransactionKind; label: string }[] = [
  { value: 'income', label: KIND_LABEL.income },
  { value: 'expense', label: KIND_LABEL.expense },
]

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
}

/** Options for payment method Selects, in display order. */
export const PAYMENT_METHOD_ITEMS: { value: PaymentMethod; label: string }[] = [
  { value: 'cash', label: PAYMENT_METHOD_LABEL.cash },
  { value: 'transfer', label: PAYMENT_METHOD_LABEL.transfer },
]
