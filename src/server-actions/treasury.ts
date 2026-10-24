import { createServerFn } from '@tanstack/react-start'
import { and, asc, eq, inArray, isNotNull, isNull, sql } from 'drizzle-orm'
import {
  type ActionResult,
  databaseError,
  EXCLUSION_VIOLATION,
  FK_VIOLATION,
  isFolioTaken,
  postgrestErrorMessage,
  UNIQUE_VIOLATION,
} from '@/lib/action-result'
import { authMiddleware } from '@/lib/auth/middleware'
import { withCurrentUser } from '@/lib/db/current-user'
import {
  houseFeeStatus,
  periods,
  transactionCategories,
  transactions,
  treasuryPeriodSummary,
} from '@/lib/db/schema'
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

// Postgres error code not covered by postgrestErrorMessage.
const CHECK_VIOLATION = '23514'

function toMessage(error: unknown, fallback: string) {
  const cause = databaseError(error)
  if (isFolioTaken(cause)) return m.common_folio_taken()
  return postgrestErrorMessage(cause, {
    fallback,
    unique: {
      transactions_one_per_house_month_category: m.treasury_error_fee_month_taken(),
      transactions_one_per_amenity_reservation_category: m.treasury_error_reservation_paid(),
      transaction_categories_name_unique: m.treasury_error_category_name_taken(),
      periods_name_unique: m.treasury_error_period_name_taken(),
    },
  })
}

function systemCategoryMessage(key: string) {
  return m.treasury_error_system_category({ source: systemCategorySource(key) })
}

// ---------------------------------------------------------------------------
// reads
// ---------------------------------------------------------------------------

/**
 * Live movements, newest first. Soft-deleted houses stay attached: the money did
 * come from them. The rows keep the database's column names and ISO timestamps,
 * the shape the screens were built on.
 */
const fetchTransactionsFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const rows = await withCurrentUser((tx) =>
      tx.query.transactions.findMany({
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
          transactionCategory: { columns: { id: true, name: true, key: true } },
          period: { columns: { id: true, name: true } },
          property: { columns: { id: true, number: true } },
        },
        where: { deletedAt: { isNull: true } },
        orderBy: { occurredOn: 'desc', createdAt: 'desc' },
      }),
    )

    return rows.flatMap((row) => {
      const { transactionCategory: category, period, property } = row
      // Category and period are required columns, so always there; Drizzle types the joins as optional anyway.
      if (!category || !period) {
        return []
      }
      return [
        {
          id: row.id,
          kind: row.kind,
          amount: row.amount,
          currency: row.currency,
          occurred_on: row.occurredOn,
          fee_month: row.feeMonth,
          payment_method: row.paymentMethod,
          folio: row.folio,
          reference: row.reference,
          description: row.description,
          notes: row.notes,
          created_at: row.createdAt.toISOString(),
          updated_at: row.updatedAt.toISOString(),
          category: { id: category.id, name: category.name, key: category.key },
          period: { id: period.id, name: period.name },
          property: property ? { id: property.id, number: property.number } : null,
        },
      ]
    })
  })

export const fetchTransactions = () => fetchTransactionsFn()

/**
 * Income / expense / balance per period and currency, computed by the
 * database over live rows. A period has one row per currency it has
 * movements in (at least one, in its own currency).
 */
const fetchPeriodSummariesFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    return withCurrentUser((tx) =>
      tx
        .select({
          period_id: treasuryPeriodSummary.periodId,
          currency: treasuryPeriodSummary.currency,
          total_income: treasuryPeriodSummary.totalIncome,
          total_expense: treasuryPeriodSummary.totalExpense,
          balance: treasuryPeriodSummary.balance,
        })
        .from(treasuryPeriodSummary),
    )
  })

export const fetchPeriodSummaries = () => fetchPeriodSummariesFn()

/** Live movements of one period, just what the monthly chart adds up. */
const fetchPeriodMovementsFn = createServerFn()
  .middleware([authMiddleware])
  .validator((periodId: string) => periodId)
  .handler(async ({ data: periodId }) => {
    return withCurrentUser((tx) =>
      tx
        .select({
          kind: transactions.kind,
          amount: transactions.amount,
          currency: transactions.currency,
          occurred_on: transactions.occurredOn,
        })
        .from(transactions)
        .where(and(eq(transactions.periodId, periodId), isNull(transactions.deletedAt))),
    )
  })

export const fetchPeriodMovements = (periodId: string) => fetchPeriodMovementsFn({ data: periodId })

/**
 * Per live house, fee months due vs paid in the current period (DB view).
 * Empty when no period covers today.
 */
const fetchHouseFeeStatusFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const rows = await withCurrentUser((tx) =>
      tx
        .select({
          property_id: houseFeeStatus.propertyId,
          number: houseFeeStatus.number,
          period_id: houseFeeStatus.periodId,
          months_due: houseFeeStatus.monthsDue,
          months_paid: houseFeeStatus.monthsPaid,
          unpaid_months: houseFeeStatus.unpaidMonths,
        })
        .from(houseFeeStatus),
    )

    // Numeric-aware so "2" sorts before "10" (Postgres would sort them as text).
    return rows.sort((a, b) => (a.number ?? '').localeCompare(b.number ?? '', 'es', { numeric: true }))
  })

export const fetchHouseFeeStatus = () => fetchHouseFeeStatusFn()

/** See fetchPeriods (server-actions/presidency) for why the count includes soft-deleted movements. */
const fetchCategoriesFn = createServerFn()
  .middleware([authMiddleware])
  .handler(async () => {
    const rows = await withCurrentUser((tx) =>
      tx.query.transactionCategories.findMany({
        columns: { id: true, kind: true, name: true, key: true, isActive: true },
        extras: {
          transactionCount: (table) =>
            sql<number>`(select count(*)::int from public.transactions t where t.category_id = ${table.id})`,
        },
        orderBy: { kind: 'asc', name: 'asc' },
      }),
    )

    return rows.map((category) => ({
      id: category.id,
      kind: category.kind,
      name: category.name,
      key: category.key,
      is_active: category.isActive,
      transaction_count: category.transactionCount,
    }))
  })

export const fetchCategories = () => fetchCategoriesFn()

// ---------------------------------------------------------------------------
// transactions
// ---------------------------------------------------------------------------

export interface FeePaymentSummary {
  fee_count: number
  late_fee_count: number
  total: number
}

const recordFeePaymentFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: RecordFeePaymentInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<FeePaymentSummary>> => {
    const parsed = recordFeePaymentSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { property_id, fee_months, occurred_on, payment_method, folio, reference, notes, waived_months } =
      parsed.data
    // Only months on this receipt: one left over from an earlier pick can't forgive anything else.
    const waivedMonths = waived_months.filter((month) => fee_months.includes(month))

    // The due-day rule decides per month; the waived months skip their late fee.
    // sql.param() sends each list as one array parameter; a bare array would be spread into several.
    let summary: { fee_count: number; late_fee_count: number; total: string }
    try {
      const result = await withCurrentUser((tx) =>
        tx.execute<{ fee_count: number; late_fee_count: number; total: string }>(sql`
          select fee_count, late_fee_count, total
          from public.record_fee_payment(
            p_property_id => ${property_id},
            p_fee_months => ${sql.param(fee_months)},
            p_occurred_on => ${occurred_on},
            p_folio => ${folio},
            p_payment_method => ${payment_method},
            p_reference => ${reference || null},
            p_notes => ${notes || null},
            p_waived_months => ${waivedMonths.length > 0 ? sql.param(waivedMonths) : null}
          )
        `),
      )
      summary = result.rows[0]
    } catch (error) {
      const cause = databaseError(error)
      // Raised by the function: no period for that date, or the house is gone.
      if (cause.code === 'P0002') {
        return {
          error: cause.message.includes('no period')
            ? m.treasury_error_no_period()
            : m.treasury_error_house_gone(),
        }
      }
      // Postgres only reports the first clash, so look up every selected month already paid.
      // A new transaction: the failed statement aborted the first one.
      if (cause.code === UNIQUE_VIOLATION) {
        const paid = await withCurrentUser((tx) =>
          tx
            .select({ feeMonth: transactions.feeMonth })
            .from(transactions)
            .where(
              and(
                eq(transactions.propertyId, property_id),
                inArray(transactions.feeMonth, fee_months),
                isNull(transactions.deletedAt),
              ),
            )
            .orderBy(asc(transactions.feeMonth)),
        ).catch(() => [])
        const months = [...new Set(paid.flatMap((row) => (row.feeMonth ? [formatMonth(row.feeMonth)] : [])))]
        if (months.length > 0) {
          return { error: m.treasury_error_fee_months_taken({ months: months.join(', ') }) }
        }
      }
      return { error: toMessage(error, m.treasury_error_record_fee_failed()) }
    }

    return {
      data: {
        fee_count: summary.fee_count,
        late_fee_count: summary.late_fee_count,
        total: Number(summary.total),
      },
    }
  })

export const recordFeePayment = (input: RecordFeePaymentInput) => recordFeePaymentFn({ data: input })

const createTransactionFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: CreateTransactionInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = createTransactionSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const {
      kind,
      category_id,
      amount,
      occurred_on,
      payment_method,
      folio,
      reference,
      property_id,
      description,
      notes,
    } = parsed.data

    try {
      return await withCurrentUser(async (tx): Promise<ActionResult<{ id: string }>> => {
        // Fees need a fee_month and the period's rates, reservation rows their booking;
        // only the SQL functions know how.
        const category = await tx.query.transactionCategories.findFirst({
          columns: { key: true },
          where: { id: category_id },
        })
        if (category?.key) {
          return { error: systemCategoryMessage(category.key) }
        }

        const period = await tx.query.periods.findFirst({
          columns: { id: true },
          where: { startsOn: { lte: occurred_on }, endsOn: { gte: occurred_on } },
        })
        if (!period) {
          return { error: m.treasury_error_no_period() }
        }

        const created = await tx
          .insert(transactions)
          .values({
            kind,
            categoryId: category_id,
            periodId: period.id,
            amount,
            occurredOn: occurred_on,
            paymentMethod: payment_method,
            folio: folio || null,
            reference: reference || null,
            propertyId: kind === 'income' ? property_id : null,
            description,
            notes: notes || null,
          })
          .returning({ id: transactions.id })

        return { data: created[0] }
      })
    } catch (error) {
      // Composite FK: the category belongs to the other kind.
      if (databaseError(error).code === FK_VIOLATION) {
        return { error: m.treasury_error_category_kind_mismatch() }
      }
      return { error: toMessage(error, m.treasury_error_create_transaction_failed()) }
    }
  })

export const createTransaction = (input: CreateTransactionInput) => createTransactionFn({ data: input })

const updateTransactionFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; input: UpdateTransactionInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult<{ id: string }>> => {
    const parsed = updateTransactionSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const {
      category_id,
      amount,
      occurred_on,
      payment_method,
      folio,
      reference,
      property_id,
      description,
      notes,
    } = parsed.data

    try {
      return await withCurrentUser(async (tx): Promise<ActionResult<{ id: string }>> => {
        const current = await tx.query.transactions.findFirst({
          columns: { kind: true },
          with: { transactionCategory: { columns: { key: true } } },
          where: { id, deletedAt: { isNull: true } },
        })
        if (!current) {
          return { error: m.treasury_error_transaction_gone() }
        }

        // Fee and late-fee rows are produced by record_fee_payment from the period's
        // rates and due day, reservation rows from their booking. Editing their amount,
        // date, month or house here would silently break that; only the receipt
        // details can change. Anything else is fixed by deleting the receipt and
        // recording it again.
        if (current.transactionCategory?.key) {
          const updated = await tx
            .update(transactions)
            .set({
              paymentMethod: payment_method,
              folio: folio || null,
              reference: reference || null,
              notes: notes || null,
            })
            .where(eq(transactions.id, id))
            .returning({ id: transactions.id })
          if (updated.length === 0) {
            return { error: m.common_no_permission() }
          }
          return { data: updated[0] }
        }

        const category = await tx.query.transactionCategories.findFirst({
          columns: { key: true },
          where: { id: category_id },
        })
        if (category?.key) {
          return { error: systemCategoryMessage(category.key) }
        }

        // The date may have moved into another period.
        const period = await tx.query.periods.findFirst({
          columns: { id: true },
          where: { startsOn: { lte: occurred_on }, endsOn: { gte: occurred_on } },
        })
        if (!period) {
          return { error: m.treasury_error_no_period() }
        }

        const updated = await tx
          .update(transactions)
          .set({
            categoryId: category_id,
            periodId: period.id,
            amount,
            occurredOn: occurred_on,
            paymentMethod: payment_method,
            folio: folio || null,
            reference: reference || null,
            propertyId: current.kind === 'income' ? property_id : null,
            description,
            notes: notes || null,
          })
          .where(eq(transactions.id, id))
          .returning({ id: transactions.id })
        if (updated.length === 0) {
          return { error: m.common_no_permission() }
        }
        return { data: updated[0] }
      })
    } catch (error) {
      if (databaseError(error).code === FK_VIOLATION) {
        return { error: m.treasury_error_category_kind_mismatch() }
      }
      return { error: toMessage(error, m.treasury_error_update_transaction_failed()) }
    }
  })

export const updateTransaction = (id: string, input: UpdateTransactionInput) =>
  updateTransactionFn({ data: { id, input } })

/**
 * Soft-deletes movements (sets deleted_at; a DB trigger stamps deleted_by).
 * Returns how many rows were affected: RLS doesn't raise on UPDATE, it just
 * filters rows out, so a short count means no permission.
 */
const deleteTransactionsFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids }): Promise<ActionResult<{ deleted: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: m.treasury_error_select_transaction() }
    }

    let deleted: Array<{ id: string }>
    try {
      deleted = await withCurrentUser((tx) =>
        tx
          .update(transactions)
          .set({ deletedAt: sql`now()` })
          .where(and(inArray(transactions.id, uniqueIds), isNull(transactions.deletedAt)))
          .returning({ id: transactions.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.treasury_error_delete_transactions_failed()) }
    }

    if (deleted.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: { deleted: deleted.length } }
  })

export const deleteTransactions = (ids: string[]) => deleteTransactionsFn({ data: ids })

/**
 * Undoes a soft delete. Fails with 23505 if the same fee month was re-recorded
 * meanwhile, or 23P01 if its folio went to another receipt.
 */
const restoreTransactionsFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((ids: string[]) => ids)
  .handler(async ({ data: ids }): Promise<ActionResult<{ restored: number }>> => {
    const uniqueIds = [...new Set(ids)]
    if (uniqueIds.length === 0) {
      return { error: m.common_nothing_to_restore() }
    }

    let restored: Array<{ id: string }>
    try {
      restored = await withCurrentUser((tx) =>
        tx
          .update(transactions)
          .set({ deletedAt: null })
          .where(and(inArray(transactions.id, uniqueIds), isNotNull(transactions.deletedAt)))
          .returning({ id: transactions.id }),
      )
    } catch (error) {
      const cause = databaseError(error)
      const message = toMessage(error, m.treasury_error_restore_transactions_failed())
      return {
        error:
          cause.code === UNIQUE_VIOLATION || isFolioTaken(cause)
            ? m.treasury_error_restore_reason({ reason: message.toLowerCase() })
            : message,
      }
    }

    if (restored.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: { restored: restored.length } }
  })

export const restoreTransactions = (ids: string[]) => restoreTransactionsFn({ data: ids })

// ---------------------------------------------------------------------------
// categories
// ---------------------------------------------------------------------------

const createCategoryFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: CategoryInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = categorySchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    const { kind, name } = parsed.data

    let created: Array<{ id: string }>
    try {
      created = await withCurrentUser((tx) =>
        tx.insert(transactionCategories).values({ kind, name }).returning({ id: transactionCategories.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.treasury_error_create_category_failed()) }
    }

    return { data: created[0] }
  })

export const createCategory = (input: CategoryInput) => createCategoryFn({ data: input })

/** Renames a category. Its kind is fixed: movements already point at it. */
const updateCategoryFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; input: Pick<CategoryInput, 'name'> }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = categorySchema.pick({ name: true }).safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    let updated: Array<{ id: string }>
    try {
      updated = await withCurrentUser((tx) =>
        tx
          .update(transactionCategories)
          .set({ name: parsed.data.name })
          .where(eq(transactionCategories.id, id))
          .returning({ id: transactionCategories.id }),
      )
    } catch (error) {
      return { error: toMessage(error, m.treasury_error_update_category_failed()) }
    }
    if (updated.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const updateCategory = (id: string, input: Pick<CategoryInput, 'name'>) =>
  updateCategoryFn({ data: { id, input } })

/** Retire / reinstate. Retired categories stay on past movements but leave the pickers. */
const setCategoryActiveFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; isActive: boolean }) => data)
  .handler(async ({ data: { id, isActive } }): Promise<ActionResult> => {
    let updated: Array<{ id: string }>
    try {
      updated = await withCurrentUser((tx) =>
        tx
          .update(transactionCategories)
          .set({ isActive })
          .where(eq(transactionCategories.id, id))
          .returning({ id: transactionCategories.id }),
      )
    } catch (error) {
      // transaction_categories_system_active: fee / late fee can't be retired.
      if (databaseError(error).code === CHECK_VIOLATION) {
        return { error: m.treasury_error_category_system_active() }
      }
      return { error: toMessage(error, m.treasury_error_update_category_failed()) }
    }
    if (updated.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const setCategoryActive = (id: string, isActive: boolean) =>
  setCategoryActiveFn({ data: { id, isActive } })

/** Hard delete; only possible while nothing references the category. */
const deleteCategoryFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ActionResult> => {
    let deleted: Array<{ id: string }>
    try {
      deleted = await withCurrentUser((tx) =>
        tx
          .delete(transactionCategories)
          .where(eq(transactionCategories.id, id))
          .returning({ id: transactionCategories.id }),
      )
    } catch (error) {
      if (databaseError(error).code === FK_VIOLATION) {
        return { error: m.treasury_error_category_in_use() }
      }
      return { error: toMessage(error, m.treasury_error_delete_category_failed()) }
    }
    if (deleted.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const deleteCategory = (id: string) => deleteCategoryFn({ data: id })

// ---------------------------------------------------------------------------
// periods
// ---------------------------------------------------------------------------

function periodErrorMessage(error: unknown, fallback: string) {
  // periods_no_overlap: two periods can't cover the same day.
  if (databaseError(error).code === EXCLUSION_VIOLATION) {
    return m.treasury_error_period_overlap()
  }
  return toMessage(error, fallback)
}

/** The form's fields as the table's columns. */
function periodValues(input: PeriodInput) {
  return {
    name: input.name,
    startsOn: input.starts_on,
    endsOn: input.ends_on,
    monthlyFee: input.monthly_fee,
    lateFee: input.late_fee,
    dueDay: input.due_day,
  }
}

const createPeriodFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((input: PeriodInput) => input)
  .handler(async ({ data: input }): Promise<ActionResult<{ id: string }>> => {
    const parsed = periodSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    let created: Array<{ id: string }>
    try {
      created = await withCurrentUser((tx) =>
        tx.insert(periods).values(periodValues(parsed.data)).returning({ id: periods.id }),
      )
    } catch (error) {
      return { error: periodErrorMessage(error, m.treasury_error_create_period_failed()) }
    }

    return { data: created[0] }
  })

export const createPeriod = (input: PeriodInput) => createPeriodFn({ data: input })

const updatePeriodFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((data: { id: string; input: PeriodInput }) => data)
  .handler(async ({ data: { id, input } }): Promise<ActionResult> => {
    const parsed = periodSchema.safeParse(input)
    if (!parsed.success) {
      return { error: m.common_form_invalid() }
    }

    let updated: Array<{ id: string }>
    try {
      updated = await withCurrentUser((tx) =>
        tx
          .update(periods)
          .set(periodValues(parsed.data))
          .where(eq(periods.id, id))
          .returning({ id: periods.id }),
      )
    } catch (error) {
      return { error: periodErrorMessage(error, m.treasury_error_update_period_failed()) }
    }
    if (updated.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const updatePeriod = (id: string, input: PeriodInput) => updatePeriodFn({ data: { id, input } })

/** Hard delete; only possible while the period has no movements. */
const deletePeriodFn = createServerFn({ method: 'POST' })
  .middleware([authMiddleware])
  .validator((id: string) => id)
  .handler(async ({ data: id }): Promise<ActionResult> => {
    let deleted: Array<{ id: string }>
    try {
      deleted = await withCurrentUser((tx) =>
        tx.delete(periods).where(eq(periods.id, id)).returning({ id: periods.id }),
      )
    } catch (error) {
      if (databaseError(error).code === FK_VIOLATION) {
        return { error: m.treasury_error_period_has_transactions() }
      }
      return { error: toMessage(error, m.treasury_error_delete_period_failed()) }
    }
    if (deleted.length === 0) {
      return { error: m.common_no_permission() }
    }

    return { data: undefined }
  })

export const deletePeriod = (id: string) => deletePeriodFn({ data: id })
