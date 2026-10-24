import { createServerFn } from '@tanstack/react-start'
import { and, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import {
  type ActionResult,
  databaseError,
  errorMessage,
  FK_VIOLATION,
  isTaken,
  UNIQUE_VIOLATION,
} from '@/lib/action-result'
import { boardMiddleware, requirePermission } from '@/lib/auth/middleware'
import { db, transactionAs } from '@/lib/db'
import {
  houseFeeStatus,
  periods,
  transactionCategories,
  transactions,
  treasuryPeriodSummary,
} from '@/lib/db/schema'
import { isServiceError } from '@/lib/services/errors'
import * as treasury from '@/lib/services/treasury'
import { systemCategorySource } from '@/lib/system-categories'
import { formatMonth } from '@/lib/utils'
import {
  type CategoryInput,
  categorySchema,
  type CreateTransactionInput,
  createTransactionSchema,
  type PeriodInput,
  periodSchema,
  type RecordFeePaymentInput,
  recordFeePaymentSchema,
  type UpdateTransactionInput,
  updateTransactionSchema,
} from '@/lib/validations/treasury'
import { m } from '@/paraglide/messages'

const transactionWrite = requirePermission({ transaction: ['write'] })
const categoryWrite = requirePermission({ category: ['write'] })
const periodWrite = requirePermission({ period: ['write'] })

function toMessage(error: unknown, fallback: string) {
  // Its rows come from somewhere else (a fee payment, a booking); the message says where.
  if (isServiceError(error) && error.code === 'system_category') {
    return m.treasury_error_system_category({ source: systemCategorySource(error.detail ?? '') })
  }
  return errorMessage(error, {
    fallback,
    service: {
      no_period: m.treasury_error_no_period(),
      category_kind: m.treasury_error_category_kind_mismatch(),
      transfer_needs_reference: m.treasury_reference_required(),
    },
    constraints: {
      transactions_one_per_house_month_category: m.treasury_error_fee_month_taken(),
      transactions_one_per_amenity_reservation_category: m.treasury_error_reservation_paid(),
      transaction_categories_name_unique: m.treasury_error_category_name_taken(),
      // A fee or late-fee category can be renamed, never retired.
      transaction_categories_system_active: m.treasury_error_category_system_active(),
      periods_name_unique: m.treasury_error_period_name_taken(),
      // Two periods can't cover the same day.
      periods_no_overlap: m.treasury_error_period_overlap(),
    },
  })
}

// ---------------------------------------------------------------------------
// reads
// ---------------------------------------------------------------------------

/** Live movements, newest first. Soft-deleted houses stay attached: the money did come from them. */
const fetchTransactionsFn = createServerFn()
  .middleware([boardMiddleware])
  .handler(() =>
    db.query.transactions.findMany({
      columns: {
        id: true,
        kind: true,
        amount: true,
        currency: true,
        occurredOn: true,
        feeMonth: true,
        paymentMethod: true,
        folio: true,
        reference: true,
        description: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      with: {
        category: { columns: { id: true, name: true, key: true } },
        period: { columns: { id: true, name: true } },
        property: { columns: { id: true, number: true } },
      },
      where: { deletedAt: { isNull: true } },
      orderBy: { occurredOn: 'desc', createdAt: 'desc' },
    }),
  )

export const fetchTransactions = () => fetchTransactionsFn()

/**
 * Income / expense / balance per period and currency, over live rows. A
 * period has one row per currency it has movements in (at least one, in its
 * own currency).
 */
const fetchPeriodSummariesFn = createServerFn()
  .middleware([boardMiddleware])
  .handler(() => db.select().from(treasuryPeriodSummary))

export const fetchPeriodSummaries = () => fetchPeriodSummariesFn()

/** Live movements of one period, just what the monthly chart adds up. */
const fetchPeriodMovementsFn = createServerFn()
  .middleware([boardMiddleware])
  .validator((periodId: string) => periodId)
  .handler(({ data: periodId }) =>
    db
      .select({
        kind: transactions.kind,
        amount: transactions.amount,
        currency: transactions.currency,
        occurredOn: transactions.occurredOn,
      })
      .from(transactions)
      .where(and(eq(transactions.periodId, periodId), isNull(transactions.deletedAt))),
  )

export const fetchPeriodMovements = (periodId: string) => fetchPeriodMovementsFn({ data: periodId })

/** Per live house, fee months due vs paid in the current period. Empty when no period covers today. */
const fetchHouseFeeStatusFn = createServerFn()
  .middleware([boardMiddleware])
  .handler(async () => {
    const rows = await db.select().from(houseFeeStatus)

    // Numeric-aware so "2" sorts before "10" (Postgres would sort them as text).
    return rows.sort((a, b) => a.number.localeCompare(b.number, 'es', { numeric: true }))
  })

export const fetchHouseFeeStatus = () => fetchHouseFeeStatusFn()

/** See fetchPeriods (server-actions/presidency) for why the count includes soft-deleted movements. */
const fetchCategoriesFn = createServerFn()
  .middleware([boardMiddleware])
  .handler(() =>
    db.query.transactionCategories.findMany({
      columns: { id: true, kind: true, name: true, key: true, isActive: true },
      extras: {
        transactionCount: (table) =>
          sql<number>`(select count(*)::int from transactions t where t.category_id = ${table.id})`,
      },
      orderBy: { kind: 'asc', name: 'asc' },
    }),
  )

export const fetchCategories = () => fetchCategoriesFn()

// ---------------------------------------------------------------------------
// transactions
// ---------------------------------------------------------------------------

export type FeePaymentSummary = treasury.FeePaymentSummary

const recordFeePaymentFn = createServerFn({ method: 'POST' })
  .middleware([transactionWrite])
  .validator((input: RecordFeePaymentInput) => input)
  .handler(async ({ data: input, context }): Promise<ActionResult<FeePaymentSummary>> => {
    const parsed = recordFeePaymentSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { propertyId, feeMonths, occurredOn, paymentMethod, folio, reference, notes } = parsed.data
    // Only months on this receipt: one left over from an earlier pick can't forgive anything else.
    const waivedMonths = parsed.data.waivedMonths.filter((month) => feeMonths.includes(month))

    try {
      const summary = await transactionAs(context.user.id, (tx) =>
        treasury.recordFeePayment(tx, context.user, {
          propertyId,
          feeMonths,
          occurredOn,
          folio,
          paymentMethod,
          reference: reference || null,
          notes: notes || null,
          waivedMonths,
        }),
      )
      return { data: summary }
    } catch (error) {
      // Postgres only reports the first clash, so look up every selected month already paid.
      // A new transaction: the failed statement aborted the first one.
      if (databaseError(error).code === UNIQUE_VIOLATION) {
        const paid = await db
          .transaction((tx) => treasury.paidFeeMonths(tx, propertyId, feeMonths))
          .catch(() => [])
        if (paid.length > 0) {
          const months = paid.map((month) => formatMonth(month)).join(', ')
          return { error: m.treasury_error_fee_months_taken({ months }) }
        }
      }
      if (isServiceError(error) && error.code === 'not_found') {
        return { error: m.treasury_error_house_gone() }
      }
      return { error: toMessage(error, m.treasury_error_record_fee_failed()) }
    }
  })

export const recordFeePayment = (input: RecordFeePaymentInput) => recordFeePaymentFn({ data: input })

const createTransactionFn = createServerFn({ method: 'POST' })
  .middleware([transactionWrite])
  .validator((input: CreateTransactionInput) => input)
  .handler(async ({ data: input, context }): Promise<ActionResult<{ id: string }>> => {
    const parsed = createTransactionSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const {
      kind,
      categoryId,
      amount,
      occurredOn,
      paymentMethod,
      folio,
      reference,
      propertyId,
      description,
      notes,
    } = parsed.data

    try {
      const created = await transactionAs(context.user.id, (tx) =>
        treasury.createTransaction(tx, context.user, {
          kind,
          categoryId,
          amount,
          occurredOn,
          paymentMethod,
          folio: folio || null,
          reference: reference || null,
          propertyId,
          description,
          notes: notes || null,
        }),
      )
      return { data: created }
    } catch (error) {
      return { error: toMessage(error, m.treasury_error_create_transaction_failed()) }
    }
  })

export const createTransaction = (input: CreateTransactionInput) => createTransactionFn({ data: input })

/**
 * A fee, late fee or booking row only takes new receipt details (see
 * src/lib/services/treasury.ts); anything else is fixed by deleting the
 * receipt and recording it again.
 */
const updateTransactionFn = createServerFn({ method: 'POST' })
  .middleware([transactionWrite])
  .validator((data: { id: string; input: UpdateTransactionInput }) => data)
  .handler(async ({ data: { id, input }, context }): Promise<ActionResult<{ id: string }>> => {
    const parsed = updateTransactionSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const {
      categoryId,
      amount,
      occurredOn,
      paymentMethod,
      folio,
      reference,
      propertyId,
      description,
      notes,
    } = parsed.data

    let updated: { id: string } | null
    try {
      updated = await transactionAs(context.user.id, (tx) =>
        treasury.updateTransaction(tx, id, {
          categoryId,
          amount,
          occurredOn,
          paymentMethod,
          folio: folio || null,
          reference: reference || null,
          propertyId,
          description,
          notes: notes || null,
        }),
      )
    } catch (error) {
      return { error: toMessage(error, m.treasury_error_update_transaction_failed()) }
    }
    if (!updated) {
      return { error: m.treasury_error_transaction_gone() }
    }

    return { data: updated }
  })

export const updateTransaction = (id: string, input: UpdateTransactionInput) =>
  updateTransactionFn({ data: { id, input } })

/** Soft-deletes movements. Returns how many were still there to delete. */
const deleteTransactionsFn = createServerFn({ method: 'POST' })
  .middleware([transactionWrite])
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids, context }): Promise<ActionResult<{ deleted: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: m.treasury_error_select_transaction() }
    }

    let deleted: Array<{ id: string }>
    try {
      deleted = await transactionAs(context.user.id, (tx) =>
        tx
          .update(transactions)
          .set({ deletedAt: new Date(), deletedBy: context.user.id })
          .where(and(inArray(transactions.id, uniqueIds), isNull(transactions.deletedAt)))
          .returning({ id: transactions.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.treasury_error_delete_transactions_failed()) }
    }
    if (deleted.length === 0) {
      return { error: m.treasury_error_transaction_gone() }
    }

    return { data: { deleted: deleted.length } }
  })

export const deleteTransactions = (ids: string[]) => deleteTransactionsFn({ data: ids })

/** Undoes a soft delete. Fails if the same fee month was recorded again meanwhile, or its folio went to another receipt. */
const restoreTransactionsFn = createServerFn({ method: 'POST' })
  .middleware([transactionWrite])
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids, context }): Promise<ActionResult<{ restored: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: m.common_nothing_to_restore() }
    }

    let restored: Array<{ id: string }>
    try {
      restored = await transactionAs(context.user.id, (tx) =>
        tx
          .update(transactions)
          .set({ deletedAt: null, deletedBy: null })
          .where(and(inArray(transactions.id, uniqueIds), isNotNull(transactions.deletedAt)))
          .returning({ id: transactions.id }),
      )
    } catch (error) {
      const message = toMessage(error, m.treasury_error_restore_transactions_failed())
      if (isTaken(error)) {
        return { error: m.treasury_error_restore_reason({ reason: message.toLowerCase() }) }
      }
      return { error: message }
    }
    if (restored.length === 0) {
      return { error: m.common_nothing_to_restore() }
    }

    return { data: { restored: restored.length } }
  })

export const restoreTransactions = (ids: string[]) => restoreTransactionsFn({ data: ids })

// ---------------------------------------------------------------------------
// categories
// ---------------------------------------------------------------------------

const createCategoryFn = createServerFn({ method: 'POST' })
  .middleware([categoryWrite])
  .validator((input: CategoryInput) => input)
  .handler(async ({ data: input, context }): Promise<ActionResult<{ id: string }>> => {
    const parsed = categorySchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { kind, name } = parsed.data

    try {
      const [created] = await transactionAs(context.user.id, (tx) =>
        tx.insert(transactionCategories).values({ kind, name }).returning({ id: transactionCategories.id }),
      )
      return { data: created }
    } catch (error) {
      return { error: toMessage(error, m.treasury_error_create_category_failed()) }
    }
  })

export const createCategory = (input: CategoryInput) => createCategoryFn({ data: input })

/** Renames a category. Its kind is fixed: movements already point at it. */
const updateCategoryFn = createServerFn({ method: 'POST' })
  .middleware([categoryWrite])
  .validator((data: { id: string; input: Pick<CategoryInput, 'name'> }) => data)
  .handler(async ({ data: { id, input }, context }): Promise<ActionResult> => {
    const parsed = categorySchema.pick({ name: true }).safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    try {
      await transactionAs(context.user.id, (tx) =>
        tx
          .update(transactionCategories)
          .set({ name: parsed.data.name })
          .where(eq(transactionCategories.id, id)),
      )
    } catch (error) {
      return { error: toMessage(error, m.treasury_error_update_category_failed()) }
    }

    return { data: undefined }
  })

export const updateCategory = (id: string, input: Pick<CategoryInput, 'name'>) =>
  updateCategoryFn({ data: { id, input } })

/** Retire / reinstate. Retired categories stay on past movements but leave the pickers. */
const setCategoryActiveFn = createServerFn({ method: 'POST' })
  .middleware([categoryWrite])
  .validator((data: { id: string; isActive: boolean }) => data)
  .handler(async ({ data: { id, isActive }, context }): Promise<ActionResult> => {
    try {
      await transactionAs(context.user.id, (tx) =>
        tx.update(transactionCategories).set({ isActive }).where(eq(transactionCategories.id, id)),
      )
    } catch (error) {
      return { error: toMessage(error, m.treasury_error_update_category_failed()) }
    }

    return { data: undefined }
  })

export const setCategoryActive = (id: string, isActive: boolean) =>
  setCategoryActiveFn({ data: { id, isActive } })

/** Hard delete; only possible while nothing refers to the category. */
const deleteCategoryFn = createServerFn({ method: 'POST' })
  .middleware([categoryWrite])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }): Promise<ActionResult> => {
    try {
      await transactionAs(context.user.id, (tx) =>
        tx.delete(transactionCategories).where(eq(transactionCategories.id, id)),
      )
    } catch (error) {
      if (databaseError(error).code === FK_VIOLATION) {
        return { error: m.treasury_error_category_in_use() }
      }
      return { error: toMessage(error, m.treasury_error_delete_category_failed()) }
    }

    return { data: undefined }
  })

export const deleteCategory = (id: string) => deleteCategoryFn({ data: id })

// ---------------------------------------------------------------------------
// periods
// ---------------------------------------------------------------------------

const createPeriodFn = createServerFn({ method: 'POST' })
  .middleware([periodWrite])
  .validator((input: PeriodInput) => input)
  .handler(async ({ data: input, context }): Promise<ActionResult<{ id: string }>> => {
    const parsed = periodSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    try {
      const created = await transactionAs(context.user.id, (tx) => treasury.createPeriod(tx, parsed.data))
      return { data: created }
    } catch (error) {
      return { error: toMessage(error, m.treasury_error_create_period_failed()) }
    }
  })

export const createPeriod = (input: PeriodInput) => createPeriodFn({ data: input })

/** The period keeps its currency: its fees are recorded in it. */
const updatePeriodFn = createServerFn({ method: 'POST' })
  .middleware([periodWrite])
  .validator((data: { id: string; input: PeriodInput }) => data)
  .handler(async ({ data: { id, input }, context }): Promise<ActionResult> => {
    const parsed = periodSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    try {
      await transactionAs(context.user.id, (tx) =>
        tx.update(periods).set(parsed.data).where(eq(periods.id, id)),
      )
    } catch (error) {
      return { error: toMessage(error, m.treasury_error_update_period_failed()) }
    }

    return { data: undefined }
  })

export const updatePeriod = (id: string, input: PeriodInput) => updatePeriodFn({ data: { id, input } })

/** Hard delete; only possible while the period has no movements. */
const deletePeriodFn = createServerFn({ method: 'POST' })
  .middleware([periodWrite])
  .validator((id: string) => id)
  .handler(async ({ data: id, context }): Promise<ActionResult> => {
    try {
      await transactionAs(context.user.id, (tx) => tx.delete(periods).where(eq(periods.id, id)))
    } catch (error) {
      if (databaseError(error).code === FK_VIOLATION) {
        return { error: m.treasury_error_period_has_transactions() }
      }
      return { error: toMessage(error, m.treasury_error_delete_period_failed()) }
    }

    return { data: undefined }
  })

export const deletePeriod = (id: string) => deletePeriodFn({ data: id })
