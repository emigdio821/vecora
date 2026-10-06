import type { Database } from '@/lib/supabase/database.types'
import { m } from '@/paraglide/messages'

export type TransactionKind = Database['public']['Enums']['transaction_kind']
export type PaymentMethod = Database['public']['Enums']['payment_method']

export const KIND_LABEL: Record<TransactionKind, string> = {
  get income() {
    return m.treasury_kind_income()
  },
  get expense() {
    return m.treasury_kind_expense()
  },
}

/** Options for kind toggles, in display order. */
export const KIND_ITEMS: { value: TransactionKind; label: string }[] = [
  {
    value: 'income',
    get label() {
      return KIND_LABEL.income
    },
  },
  {
    value: 'expense',
    get label() {
      return KIND_LABEL.expense
    },
  },
]

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  get cash() {
    return m.common_payment_method_cash()
  },
  get transfer() {
    return m.common_payment_method_transfer()
  },
}

/** Options for payment method Selects, in display order. */
export const PAYMENT_METHOD_ITEMS: { value: PaymentMethod; label: string }[] = [
  {
    value: 'cash',
    get label() {
      return PAYMENT_METHOD_LABEL.cash
    },
  },
  {
    value: 'transfer',
    get label() {
      return PAYMENT_METHOD_LABEL.transfer
    },
  },
]
