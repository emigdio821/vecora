// Treasury: periods, categories and the ledger.
//
//   * A period is the board's fiscal year ("2026-2027") and carries its fee
//     rules: monthly fee, late fee, due day. Periods never overlap
//     (periods_no_overlap, in the custom migration).
//   * A transaction is one line of money in or out. The amount is always
//     positive; kind gives the sign. Balances are derived, never stored.
//   * The monthly fee is income tied to a house (propertyId) and to the month
//     it covers (feeMonth). A late fee is its own row in the late-fee category.
//   * folio is the number of the paper receipt. Every line of one receipt
//     shares it; another receipt never reuses it (transactions_folio_one_receipt,
//     in the custom migration).
//   * Every amount keeps the currency it was recorded in, so totals are per
//     currency.
//
// Transactions are soft-deleted and never purged: money questions from years
// back must stay answerable.
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  foreignKey,
  index,
  integer,
  numeric,
  pgTable,
  pgView,
  smallint,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { users } from './auth'
import { currencyCode, paymentMethod, transactionKind } from './enums'
import { amenityReservations } from './presidency'
import { properties } from './registry'

export const periods = pgTable(
  'periods',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    startsOn: date('starts_on').notNull(),
    endsOn: date('ends_on').notNull(),
    /** What each house pays per month during the period, in its currency. */
    monthlyFee: numeric('monthly_fee', { mode: 'number', precision: 12, scale: 2 }).notNull(),
    /** Added when a month's fee is paid after dueDay. */
    lateFee: numeric('late_fee', { mode: 'number', precision: 12, scale: 2 }).default(100).notNull(),
    /** Day of the month the fee is due (inclusive). Up to 28, so every month has it. */
    dueDay: smallint('due_day').default(10).notNull(),
    /** The fees paid in this period are recorded in it. */
    currency: currencyCode('currency').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('periods_name_unique').on(sql`lower(${table.name})`),
    check('periods_name_not_blank', sql`btrim(${table.name}) <> ''`),
    check('periods_dates_ordered', sql`${table.endsOn} > ${table.startsOn}`),
    check('periods_monthly_fee_positive', sql`${table.monthlyFee} > 0`),
    check('periods_late_fee_not_negative', sql`${table.lateFee} >= 0`),
    check('periods_due_day_valid', sql`${table.dueDay} between 1 and 28`),
  ],
)

/** Keys of the categories the app itself needs to find. */
export const SYSTEM_CATEGORY_KEYS = ['fee', 'late_fee', 'amenity_fee', 'amenity_refund'] as const

export type SystemCategoryKey = (typeof SYSTEM_CATEGORY_KEYS)[number]

// The treasurer's categories, per kind. One used by a transaction is retired
// (isActive = false) instead of deleted.
export const transactionCategories = pgTable(
  'transaction_categories',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kind: transactionKind('kind').notNull(),
    name: text('name').notNull(),
    /** One of SYSTEM_CATEGORY_KEYS for the categories the app needs; null for the treasurer's own. */
    key: text('key').unique(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('transaction_categories_name_unique').on(table.kind, sql`lower(${table.name})`),
    // Lets a transaction's category be of its own kind (transactions_category_fkey).
    unique('transaction_categories_id_kind_unique').on(table.id, table.kind),
    check('transaction_categories_name_not_blank', sql`btrim(${table.name}) <> ''`),
    // A system category can be renamed but never retired.
    check('transaction_categories_system_active', sql`${table.key} is null or ${table.isActive}`),
  ],
)

// Every foreign key restricts a hard delete: history outlives what it points at.
export const transactions = pgTable(
  'transactions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    kind: transactionKind('kind').notNull(),
    categoryId: uuid('category_id').notNull(),
    periodId: uuid('period_id')
      .notNull()
      .references(() => periods.id, { onDelete: 'restrict' }),
    propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'restrict' }),
    /** The booking this fee or refund belongs to. Deleting an unpaid booking leaves its deleted payments as plain history. */
    amenityReservationId: uuid('amenity_reservation_id'),
    /** Always positive; kind says whether it adds or subtracts. */
    amount: numeric('amount', { mode: 'number', precision: 12, scale: 2 }).notNull(),
    /** Fixed when recorded: the HOA's, or that of the period, booking or request it comes from. */
    currency: currencyCode('currency').notNull(),
    /** The day the money moved, which may be before it was recorded. */
    occurredOn: date('occurred_on').notNull(),
    /** Fees and their late fees: the first day of the month paid for. */
    feeMonth: date('fee_month'),
    paymentMethod: paymentMethod('payment_method').default('cash').notNull(),
    /** Number of the paper receipt; shared by every line of it. */
    folio: text('folio'),
    /** Transfer reference or supplier invoice. Required for transfers. */
    reference: text('reference'),
    description: text('description').notNull(),
    notes: text('notes'),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => [
    // The category is of the row's own kind.
    foreignKey({
      name: 'transactions_category_fkey',
      columns: [table.categoryId, table.kind],
      foreignColumns: [transactionCategories.id, transactionCategories.kind],
    }).onDelete('restrict'),
    // Named here: the generated name is too long for Postgres and gets cut.
    foreignKey({
      name: 'transactions_amenity_reservation_id_fkey',
      columns: [table.amenityReservationId],
      foreignColumns: [amenityReservations.id],
    }).onDelete('set null'),
    // Listing: newest first among live rows.
    index('transactions_live_occurred_on_idx')
      .on(table.occurredOn.desc(), table.createdAt.desc())
      .where(sql`${table.deletedAt} is null`),
    index('transactions_period_id_idx').on(table.periodId),
    index('transactions_category_id_idx').on(table.categoryId),
    index('transactions_property_id_idx')
      .on(table.propertyId)
      .where(sql`${table.propertyId} is not null`),
    index('transactions_amenity_reservation_id_idx')
      .on(table.amenityReservationId)
      .where(sql`${table.amenityReservationId} is not null`),
    index('transactions_folio_idx')
      .on(table.folio)
      .where(sql`${table.folio} is not null`),
    index('transactions_fee_month_property_idx')
      .on(table.feeMonth, table.propertyId)
      .where(sql`${table.feeMonth} is not null and ${table.deletedAt} is null`),
    // One live fee (and one live late fee) per house and month.
    uniqueIndex('transactions_one_per_house_month_category')
      .on(table.propertyId, table.feeMonth, table.categoryId)
      .where(sql`${table.feeMonth} is not null and ${table.deletedAt} is null`),
    // One live fee and one live refund per booking.
    uniqueIndex('transactions_one_per_amenity_reservation_category')
      .on(table.amenityReservationId, table.categoryId)
      .where(sql`${table.amenityReservationId} is not null and ${table.deletedAt} is null`),
    check('transactions_amount_positive', sql`${table.amount} > 0`),
    check('transactions_description_not_blank', sql`btrim(${table.description}) <> ''`),
    check('transactions_folio_not_blank', sql`${table.folio} is null or btrim(${table.folio}) <> ''`),
    check(
      'transactions_reference_not_blank',
      sql`${table.reference} is null or btrim(${table.reference}) <> ''`,
    ),
    check(
      'transactions_fee_month_first_day',
      sql`${table.feeMonth} is null or extract(day from ${table.feeMonth}) = 1`,
    ),
    check(
      'transactions_transfer_has_reference',
      sql`${table.paymentMethod} <> 'transfer' or ${table.reference} is not null`,
    ),
    check(
      'transactions_fee_month_needs_property',
      sql`${table.feeMonth} is null or (${table.kind} = 'income' and ${table.propertyId} is not null)`,
    ),
  ],
)

/** Income, expense and balance per period and currency, over live transactions. A period with no movements gets one row of zeros, in its own currency. */
export const treasuryPeriodSummary = pgView('treasury_period_summary', {
  periodId: uuid('period_id').notNull(),
  currency: currencyCode('currency').notNull(),
  totalIncome: numeric('total_income', { mode: 'number', precision: 12, scale: 2 }).notNull(),
  totalExpense: numeric('total_expense', { mode: 'number', precision: 12, scale: 2 }).notNull(),
  balance: numeric('balance', { mode: 'number', precision: 12, scale: 2 }).notNull(),
}).as(sql`
  select
    p.id as period_id,
    coalesce(t.currency, p.currency) as currency,
    coalesce(sum(t.amount) filter (where t.kind = 'income'), 0)::numeric(12,2) as total_income,
    coalesce(sum(t.amount) filter (where t.kind = 'expense'), 0)::numeric(12,2) as total_expense,
    coalesce(sum(case t.kind when 'income' then t.amount else -t.amount end), 0)::numeric(12,2) as balance
  from periods p
  left join transactions t on t.period_id = p.id and t.deleted_at is null
  group by p.id, coalesce(t.currency, p.currency)
`)

/**
 * Per live house, for the period that covers today: the fee months due so far
 * (from the period's start to this month), how many have a fee, and which are
 * missing. Up to date when unpaidMonths is empty; no rows when no period
 * covers today.
 */
export const houseFeeStatus = pgView('house_fee_status', {
  propertyId: uuid('property_id').notNull(),
  number: text('number').notNull(),
  periodId: uuid('period_id').notNull(),
  monthsDue: integer('months_due').notNull(),
  monthsPaid: integer('months_paid').notNull(),
  unpaidMonths: date('unpaid_months').array().notNull(),
}).as(sql`
  with current_period as (
    select id, starts_on, ends_on from periods
    where current_date between starts_on and ends_on
  ),
  due_months as (
    select
      cp.id as period_id,
      generate_series(
        date_trunc('month', cp.starts_on)::date,
        date_trunc('month', least(current_date, cp.ends_on))::date,
        interval '1 month'
      )::date as fee_month
    from current_period cp
  ),
  fee_category as (
    select id from transaction_categories where key = 'fee'
  )
  select
    pr.id as property_id,
    pr.number,
    dm.period_id,
    count(dm.fee_month)::int as months_due,
    count(t.id)::int as months_paid,
    coalesce(array_agg(dm.fee_month order by dm.fee_month) filter (where t.id is null), '{}'::date[]) as unpaid_months
  from properties pr
  cross join due_months dm
  left join transactions t
    on t.property_id = pr.id
    and t.fee_month = dm.fee_month
    and t.category_id = (select id from fee_category)
    and t.deleted_at is null
  where pr.deleted_at is null
  group by pr.id, pr.number, dm.period_id
`)
