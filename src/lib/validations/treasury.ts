import { z } from 'zod'
import { PAYMENT_METHODS, TRANSACTION_KINDS } from '@/lib/enums'
import { m } from '@/paraglide/messages'

export { PAYMENT_METHODS, type PaymentMethod, TRANSACTION_KINDS, type TransactionKind } from '@/lib/enums'

const requiredText = (message: () => string) => z.string().trim().min(1, { error: message })

/** One paper receipt: a house paying one or more months of the fee. */
export const recordFeePaymentSchema = z
  .object({
    propertyId: z.uuid({ error: () => m.common_select_house() }),
    // "YYYY-MM-01" per month covered
    feeMonths: z.array(z.iso.date()).min(1, { error: () => m.treasury_select_month_required() }),
    occurredOn: z.iso.date({ error: () => m.common_invalid_date() }),
    paymentMethod: z.enum(PAYMENT_METHODS),
    folio: requiredText(() => m.treasury_folio_required()),
    reference: z.string().trim(),
    notes: z.string().trim(),
    // The late fee follows the due-day rule; this only lets the treasurer
    // waive it for some of the late months (when the board forgives it).
    waivedMonths: z.array(z.iso.date()),
  })
  .refine((data) => data.paymentMethod !== 'transfer' || data.reference.length > 0, {
    path: ['reference'],
    error: () => m.treasury_reference_required(),
  })

export type RecordFeePaymentInput = z.infer<typeof recordFeePaymentSchema>

/** Any income or expense that is not a monthly fee (those go through recordFeePaymentSchema). */
export const createTransactionSchema = z
  .object({
    kind: z.enum(TRANSACTION_KINDS),
    categoryId: z.uuid({ error: () => m.treasury_select_category() }),
    amount: z
      .number({ error: () => m.common_amount_required() })
      .positive({ error: () => m.common_amount_positive() }),
    occurredOn: z.iso.date({ error: () => m.common_invalid_date() }),
    paymentMethod: z.enum(PAYMENT_METHODS),
    // Paper receipt number, only handed out for income
    folio: z.string().trim(),
    reference: z.string().trim(),
    // Which house the money came from, when it did (fines, reservation fees…)
    propertyId: z.uuid().nullable(),
    description: requiredText(() => m.treasury_description_required()),
    notes: z.string().trim(),
  })
  .refine((data) => data.kind !== 'income' || data.folio.length > 0, {
    path: ['folio'],
    error: () => m.treasury_folio_required(),
  })
  .refine((data) => data.paymentMethod !== 'transfer' || data.reference.length > 0, {
    path: ['reference'],
    error: () => m.treasury_reference_required(),
  })

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

// Same fields; `kind` is read-only on edit (the action keeps the stored one) but
// stays in the payload so the folio rule can still run.
export const updateTransactionSchema = createTransactionSchema

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>

export const categorySchema = z.object({
  kind: z.enum(TRANSACTION_KINDS),
  // Unique per kind (case-insensitive).
  name: requiredText(() => m.common_name_required()),
})

export type CategoryInput = z.infer<typeof categorySchema>

export const periodSchema = z
  .object({
    // Unique (case-insensitive).
    name: requiredText(() => m.common_name_required()),
    startsOn: z.iso.date({ error: () => m.common_invalid_date() }),
    endsOn: z.iso.date({ error: () => m.common_invalid_date() }),
    monthlyFee: z
      .number({ error: () => m.treasury_monthly_fee_required() })
      .positive({ error: () => m.treasury_monthly_fee_positive() }),
    lateFee: z
      .number({ error: () => m.treasury_late_fee_required() })
      .min(0, { error: () => m.treasury_late_fee_negative() }),
    // Capped at 28 so it exists in every month.
    dueDay: z
      .number({ error: () => m.treasury_due_day_required() })
      .int()
      .min(1, { error: () => m.treasury_due_day_range() })
      .max(28, { error: () => m.treasury_due_day_range() }),
  })
  .refine((data) => data.endsOn > data.startsOn, {
    path: ['endsOn'],
    error: () => m.treasury_ends_after_start(),
  })

export type PeriodInput = z.infer<typeof periodSchema>
