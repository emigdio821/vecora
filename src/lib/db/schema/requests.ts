// Payment requests: what maintenance and security spent or need to spend, for
// the treasurer to pay.
//
//   * The section's role records a request; it starts pending, and stays
//     editable and deletable by that role while it is.
//   * The treasurer resolves it: paid records the expense in the ledger and
//     links it (transactionId); rejected keeps it with the reason. A rejected
//     request can be taken back to pending; a paid one stays closed.
//   * The amount keeps the currency it was requested in.
//
// Both sections share the lifecycle and the columns; security requests also
// say what the money is for (kind).
import { sql } from 'drizzle-orm'
import {
  check,
  date,
  index,
  numeric,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  type ExtraConfigColumn,
  type PgColumn,
} from 'drizzle-orm/pg-core'
import { REQUEST_STATUSES, SECURITY_REQUEST_KINDS } from '../../enums'
import { users } from './auth'
import { currencyCode } from './enums'
import { transactions } from './treasury'

export const requestStatus = pgEnum('request_status', REQUEST_STATUSES)

export const securityRequestKind = pgEnum('security_request_kind', SECURITY_REQUEST_KINDS)

function requestColumns() {
  return {
    id: uuid('id').defaultRandom().primaryKey(),
    title: text('title').notNull(),
    details: text('details'),
    amount: numeric('amount', { mode: 'number', precision: 12, scale: 2 }).notNull(),
    currency: currencyCode('currency').notNull(),
    /** The day the work was done or the purchase made, not when it was typed in. */
    requestedOn: date('requested_on').notNull(),
    status: requestStatus('status').default('pending').notNull(),
    rejectionReason: text('rejection_reason'),
    resolvedBy: uuid('resolved_by').references(() => users.id, { onDelete: 'restrict' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true }),
    /** The expense recorded when the treasurer paid it; set only while paid. */
    transactionId: uuid('transaction_id')
      .unique()
      .references(() => transactions.id, { onDelete: 'restrict' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }
}

interface RequestTableColumns {
  title: PgColumn
  amount: PgColumn
  // The index sorts by it, which only the extra config's columns can.
  requestedOn: ExtraConfigColumn
  status: PgColumn
  rejectionReason: PgColumn
  resolvedBy: PgColumn
  resolvedAt: PgColumn
  transactionId: PgColumn
  createdBy: PgColumn
}

function requestRules(name: string, table: RequestTableColumns) {
  return [
    index(`${name}_status_requested_on_idx`).on(table.status, table.requestedOn.desc()),
    index(`${name}_created_by_idx`).on(table.createdBy),
    check(`${name}_title_not_blank`, sql`btrim(${table.title}) <> ''`),
    check(`${name}_amount_positive`, sql`${table.amount} > 0`),
    // The resolution columns always agree with the status.
    check(
      `${name}_resolution_consistent`,
      sql`(${table.status} = 'pending'
          and ${table.resolvedBy} is null and ${table.resolvedAt} is null
          and ${table.transactionId} is null and ${table.rejectionReason} is null)
        or (${table.status} = 'paid'
          and ${table.resolvedBy} is not null and ${table.resolvedAt} is not null
          and ${table.transactionId} is not null and ${table.rejectionReason} is null)
        or (${table.status} = 'rejected'
          and ${table.resolvedBy} is not null and ${table.resolvedAt} is not null
          and ${table.transactionId} is null and btrim(coalesce(${table.rejectionReason}, '')) <> '')`,
    ),
  ]
}

export const maintenanceRequests = pgTable('maintenance_requests', requestColumns(), (table) =>
  requestRules('maintenance_requests', table),
)

export const securityRequests = pgTable(
  'security_requests',
  {
    ...requestColumns(),
    /** What the money is for; picks the default expense category and filters the table. */
    kind: securityRequestKind('kind').default('other').notNull(),
  },
  (table) => requestRules('security_requests', table),
)
