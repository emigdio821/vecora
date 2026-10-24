// The ledger's rules (see the model in src/lib/db/schema/treasury.ts):
//
//   * Every movement belongs to the period that covers its day.
//   * A row of a system category (fees, late fees, bookings) is written by
//     the action it comes from: recordFeePayment here, the bookings in
//     ./presidency.ts. Typed by hand it would miss its month, house or
//     booking, so the ledger refuses it, and only lets its receipt details
//     change afterwards.
//   * A transfer always carries its reference.
//   * New amounts take the HOA's currency; a fee takes its period's.
import { and, eq, inArray, isNull } from 'drizzle-orm'
import type { Transaction } from '@/lib/db/client'
import { periods, properties, transactionCategories, transactions } from '@/lib/db/schema'
import type { SystemCategoryKey } from '@/lib/db/schema/treasury'
import type { Actor } from './actor'
import { ServiceError } from './errors'
import { hoaCurrency } from './settings'

type PaymentMethod = (typeof transactions.$inferSelect)['paymentMethod']
type TransactionKind = (typeof transactions.$inferSelect)['kind']

// The month names of the descriptions the ledger writes ("Cuota Agosto 2026").
// Stored text, so in the HOA's data language, not the screen's.
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]

/** "Agosto 2026" for "2026-08-01". */
export function monthLabel(day: string): string {
  const [year, month] = day.split('-')
  return `${MONTH_NAMES[Number(month) - 1]} ${Number(year)}`
}

/** "Terraza 12 Agosto 2026" for a booking of the Terraza on "2026-08-12". */
export function dayLabel(name: string, day: string): string {
  return `${name} ${Number(day.split('-')[2])} ${monthLabel(day)}`
}

/** The period that covers `day` ("YYYY-MM-DD"). Periods never overlap, so there's at most one. */
export async function periodCovering(tx: Transaction, day: string) {
  const period = await tx.query.periods.findFirst({
    where: { startsOn: { lte: day }, endsOn: { gte: day } },
  })
  if (!period) {
    throw new ServiceError('no_period', day)
  }
  return period
}

/** The id of a system category. They are created by the migrations and can't be deleted. */
export async function systemCategoryId(tx: Transaction, key: SystemCategoryKey): Promise<string> {
  const [category] = await tx
    .select({ id: transactionCategories.id })
    .from(transactionCategories)
    .where(eq(transactionCategories.key, key))
    .limit(1)
  return category.id
}

export function requireReference(paymentMethod: PaymentMethod, reference: string | null): void {
  if (paymentMethod === 'transfer' && !reference) {
    throw new ServiceError('transfer_needs_reference')
  }
}

export interface FeePaymentInput {
  propertyId: string
  /** First days of the months paid ("YYYY-MM-01"). */
  feeMonths: string[]
  occurredOn: string
  folio: string
  paymentMethod: PaymentMethod
  reference: string | null
  notes: string | null
  /** Months of this receipt whose late fee the board forgave. */
  waivedMonths?: string[]
  /** Forces the late fee on (or off) for every month, instead of the due-day rule. */
  applyLateFee?: boolean
}

export interface FeePaymentSummary {
  feeCount: number
  lateFeeCount: number
  total: number
}

/**
 * One paper receipt of a house: a fee row per month paid, plus a late-fee row
 * for each month paid after its due day (unless forgiven). All in the period
 * of the payment's day, at its rates and in its currency. Every row shares
 * the folio and, written in one transaction, the created_at that makes them
 * one receipt (transactions_folio_one_receipt).
 */
export async function recordFeePayment(
  tx: Transaction,
  actor: Actor,
  input: FeePaymentInput,
): Promise<FeePaymentSummary> {
  if (input.feeMonths.length === 0) {
    throw new ServiceError('not_found', 'no fee months')
  }
  requireReference(input.paymentMethod, input.reference)

  const period = await periodCovering(tx, input.occurredOn)

  const [house] = await tx
    .select({ id: properties.id })
    .from(properties)
    .where(and(eq(properties.id, input.propertyId), isNull(properties.deletedAt)))
    .limit(1)
  if (!house) {
    throw new ServiceError('not_found', `house ${input.propertyId}`)
  }

  const feeCategoryId = await systemCategoryId(tx, 'fee')
  const lateFeeCategoryId = await systemCategoryId(tx, 'late_fee')
  const waived = new Set(input.waivedMonths ?? [])

  const rows: Array<typeof transactions.$inferInsert> = []
  const summary: FeePaymentSummary = { feeCount: 0, lateFeeCount: 0, total: 0 }

  for (const feeMonth of input.feeMonths) {
    const label = monthLabel(feeMonth)
    const shared = {
      kind: 'income' as const,
      periodId: period.id,
      propertyId: input.propertyId,
      currency: period.currency,
      occurredOn: input.occurredOn,
      feeMonth,
      paymentMethod: input.paymentMethod,
      folio: input.folio,
      reference: input.reference,
      createdBy: actor.id,
    }

    rows.push({
      ...shared,
      categoryId: feeCategoryId,
      amount: period.monthlyFee,
      description: `Cuota ${label}`,
      notes: input.notes,
    })
    summary.feeCount = summary.feeCount + 1
    summary.total = summary.total + period.monthlyFee

    // Due on the period's due day of the month paid; anything after is late.
    const dueOn = `${feeMonth.slice(0, 8)}${String(period.dueDay).padStart(2, '0')}`
    let isLate = input.occurredOn > dueOn
    if (input.applyLateFee !== undefined) {
      isLate = input.applyLateFee
    }
    if (isLate && !waived.has(feeMonth) && period.lateFee > 0) {
      rows.push({
        ...shared,
        categoryId: lateFeeCategoryId,
        amount: period.lateFee,
        description: `Recargo ${label}`,
      })
      summary.lateFeeCount = summary.lateFeeCount + 1
      summary.total = summary.total + period.lateFee
    }
  }

  await tx.insert(transactions).values(rows)
  return summary
}

/** The fee months of `feeMonths` the house already has a live fee for. */
export async function paidFeeMonths(
  tx: Transaction,
  propertyId: string,
  feeMonths: string[],
): Promise<string[]> {
  const feeCategoryId = await systemCategoryId(tx, 'fee')
  const paid = await tx
    .selectDistinct({ feeMonth: transactions.feeMonth })
    .from(transactions)
    .where(
      and(
        eq(transactions.propertyId, propertyId),
        eq(transactions.categoryId, feeCategoryId),
        inArray(transactions.feeMonth, feeMonths),
        isNull(transactions.deletedAt),
      ),
    )
  return paid.flatMap((row) => (row.feeMonth ? [row.feeMonth] : [])).sort()
}

/** A category the ledger may take by hand: of the row's kind, and not a system one. */
async function requireManualCategory(
  tx: Transaction,
  categoryId: string,
  kind: TransactionKind,
): Promise<void> {
  const category = await tx.query.transactionCategories.findFirst({
    columns: { kind: true, key: true },
    where: { id: categoryId },
  })
  if (!category || category.kind !== kind) {
    throw new ServiceError('category_kind')
  }
  if (category.key !== null) {
    throw new ServiceError('system_category', category.key)
  }
}

export interface ManualTransactionFields {
  categoryId: string
  amount: number
  occurredOn: string
  paymentMethod: PaymentMethod
  folio: string | null
  reference: string | null
  /** Income only: the house the money came from. */
  propertyId: string | null
  description: string
  notes: string | null
}

/** A movement typed into the ledger: an expense, or income that isn't a fee or a booking. */
export async function createTransaction(
  tx: Transaction,
  actor: Actor,
  input: ManualTransactionFields & { kind: TransactionKind },
): Promise<{ id: string }> {
  await requireManualCategory(tx, input.categoryId, input.kind)
  requireReference(input.paymentMethod, input.reference)
  const period = await periodCovering(tx, input.occurredOn)

  let propertyId: string | null = null
  if (input.kind === 'income') {
    propertyId = input.propertyId
  }

  const [created] = await tx
    .insert(transactions)
    .values({
      kind: input.kind,
      categoryId: input.categoryId,
      periodId: period.id,
      propertyId,
      amount: input.amount,
      currency: await hoaCurrency(tx),
      occurredOn: input.occurredOn,
      paymentMethod: input.paymentMethod,
      folio: input.folio,
      reference: input.reference,
      description: input.description,
      notes: input.notes,
      createdBy: actor.id,
    })
    .returning({ id: transactions.id })
  return created
}

/**
 * Edits a live movement. A fee, late fee or booking row keeps what its action
 * set (amount, day, month, house): only the receipt details change; anything
 * else is fixed by deleting the receipt and recording it again. Its currency
 * never changes. Null when the movement is gone.
 */
export async function updateTransaction(
  tx: Transaction,
  id: string,
  input: ManualTransactionFields,
): Promise<{ id: string } | null> {
  const current = await tx.query.transactions.findFirst({
    columns: { kind: true },
    with: { category: { columns: { key: true } } },
    where: { id, deletedAt: { isNull: true } },
  })
  if (!current) {
    return null
  }
  requireReference(input.paymentMethod, input.reference)

  if (current.category.key !== null) {
    await tx
      .update(transactions)
      .set({
        paymentMethod: input.paymentMethod,
        folio: input.folio,
        reference: input.reference,
        notes: input.notes,
      })
      .where(eq(transactions.id, id))
    return { id }
  }

  await requireManualCategory(tx, input.categoryId, current.kind)
  // The day may have moved into another period.
  const period = await periodCovering(tx, input.occurredOn)

  let propertyId: string | null = null
  if (current.kind === 'income') {
    propertyId = input.propertyId
  }

  await tx
    .update(transactions)
    .set({
      categoryId: input.categoryId,
      periodId: period.id,
      propertyId,
      amount: input.amount,
      occurredOn: input.occurredOn,
      paymentMethod: input.paymentMethod,
      folio: input.folio,
      reference: input.reference,
      description: input.description,
      notes: input.notes,
    })
    .where(eq(transactions.id, id))
  return { id }
}

export interface PeriodFields {
  name: string
  startsOn: string
  endsOn: string
  monthlyFee: number
  lateFee: number
  dueDay: number
}

/** A new fiscal period, in the HOA's currency (its fees are recorded in it). */
export async function createPeriod(tx: Transaction, input: PeriodFields): Promise<{ id: string }> {
  const [created] = await tx
    .insert(periods)
    .values({ ...input, currency: await hoaCurrency(tx) })
    .returning({ id: periods.id })
  return created
}
