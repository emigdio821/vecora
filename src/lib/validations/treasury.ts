import { z } from 'zod'

// Mirrors the `payment_method` enum in the database.
export const PAYMENT_METHODS = ['cash', 'transfer'] as const

export type PaymentMethod = (typeof PAYMENT_METHODS)[number]

const requiredText = (label: string) => z.string().trim().min(1, `${label} es requerido`)

/** One paper receipt: a house paying one or more months of the fee. */
export const recordFeePaymentSchema = z
  .object({
    property_id: z.uuid('Selecciona una casa'),
    // "YYYY-MM-01" per month covered
    fee_months: z.array(z.iso.date()).min(1, 'Selecciona al menos un mes'),
    occurred_on: z.iso.date('Fecha inválida'),
    payment_method: z.enum(PAYMENT_METHODS),
    folio: requiredText('Folio'),
    reference: z.string().trim(),
    notes: z.string().trim(),
    // The DB applies the recargo by the due-day rule; this only lets the
    // treasurer waive it ("condonado por la mesa").
    waive_late_fee: z.boolean(),
  })
  .refine((data) => data.payment_method !== 'transfer' || data.reference.length > 0, {
    path: ['reference'],
    message: 'La referencia es requerida para transferencias',
  })

export type RecordFeePaymentInput = z.infer<typeof recordFeePaymentSchema>

// Mirrors the `transaction_kind` enum in the database.
export const TRANSACTION_KINDS = ['income', 'expense'] as const

export type TransactionKind = (typeof TRANSACTION_KINDS)[number]

/** Any income or expense that is not a monthly fee (those go through recordFeePaymentSchema). */
export const createTransactionSchema = z
  .object({
    kind: z.enum(TRANSACTION_KINDS),
    category_id: z.uuid('Selecciona una categoría'),
    amount: z.number('Monto es requerido').positive('El monto debe ser mayor a cero'),
    occurred_on: z.iso.date('Fecha inválida'),
    payment_method: z.enum(PAYMENT_METHODS),
    // Paper receipt number, only handed out for income
    folio: z.string().trim(),
    reference: z.string().trim(),
    // Which house the money came from, when it did (fines, hall fees…)
    property_id: z.uuid().nullable(),
    description: requiredText('Concepto'),
    notes: z.string().trim(),
  })
  .refine((data) => data.kind !== 'income' || data.folio.length > 0, {
    path: ['folio'],
    message: 'Folio es requerido',
  })
  .refine((data) => data.payment_method !== 'transfer' || data.reference.length > 0, {
    path: ['reference'],
    message: 'La referencia es requerida para transferencias',
  })

export type CreateTransactionInput = z.infer<typeof createTransactionSchema>

// Same fields; `kind` is read-only on edit (the action keeps the stored one) but
// stays in the payload so the folio rule can still run.
export const updateTransactionSchema = createTransactionSchema

export type UpdateTransactionInput = z.infer<typeof updateTransactionSchema>

export const categorySchema = z.object({
  kind: z.enum(TRANSACTION_KINDS),
  // Unique per kind in the DB (case-insensitive).
  name: requiredText('Nombre'),
})

export type CategoryInput = z.infer<typeof categorySchema>

export const periodSchema = z
  .object({
    // Unique in the DB (case-insensitive).
    name: requiredText('Nombre'),
    starts_on: z.iso.date('Fecha inválida'),
    ends_on: z.iso.date('Fecha inválida'),
    monthly_fee: z.number('Cuota es requerida').positive('La cuota debe ser mayor a cero'),
    late_fee: z.number('Recargo es requerido').min(0, 'El recargo no puede ser negativo'),
    // Capped at 28 so it exists in every month.
    due_day: z.number('Día límite es requerido').int().min(1, 'Entre 1 y 28').max(28, 'Entre 1 y 28'),
  })
  .refine((data) => data.ends_on > data.starts_on, {
    path: ['ends_on'],
    message: 'Debe ser posterior al inicio',
  })

export type PeriodInput = z.infer<typeof periodSchema>
