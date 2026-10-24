// Common areas (terrace, pool...) and their bookings. Periods, also managed
// from Presidency, are in treasury.ts with the ledger.
//
//   * An area is booked by the day, one house per area per day.
//   * A booking may carry a fee (amount; 0 = free), paid in full. Collecting
//     it is an income row linked back through transactions.amenityReservationId;
//     the booking counts as paid while that row is live.
//   * A paid booking is cancelled instead of deleted: it stays as history, its
//     day is freed, and a refund (up to what was paid) is an expense.
//   * An area with bookings is retired (isActive = false) instead of deleted.
import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  date,
  index,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { users } from './auth'
import { currencyCode } from './enums'
import { properties } from './registry'

export const amenities = pgTable(
  'amenities',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    /** Proposed when booking, in the HOA's current currency; each booking can change it. 0 = free. */
    defaultFee: numeric('default_fee', { mode: 'number', precision: 12, scale: 2 }).default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('amenities_name_unique').on(sql`lower(${table.name})`),
    check('amenities_name_not_blank', sql`btrim(${table.name}) <> ''`),
    check('amenities_default_fee_not_negative', sql`${table.defaultFee} >= 0`),
  ],
)

// History, cancelled ones included: restrict, so the purge keeps a house that has any.
export const amenityReservations = pgTable(
  'amenity_reservations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    amenityId: uuid('amenity_id')
      .notNull()
      .references(() => amenities.id, { onDelete: 'restrict' }),
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'restrict' }),
    reservedOn: date('reserved_on').notNull(),
    /** Price of the booking, paid in full. 0 = free. */
    amount: numeric('amount', { mode: 'number', precision: 12, scale: 2 }).notNull(),
    /** Fixed when booked; its fee and refund are recorded in it. */
    currency: currencyCode('currency').notNull(),
    notes: text('notes'),
    /** A cancelled booking frees its day and never changes again. */
    cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
    cancelledBy: uuid('cancelled_by').references(() => users.id, { onDelete: 'restrict' }),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id, { onDelete: 'restrict' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // What makes a double booking impossible; a cancelled booking no longer holds its day.
    uniqueIndex('amenity_reservations_one_per_day')
      .on(table.amenityId, table.reservedOn)
      .where(sql`${table.cancelledAt} is null`),
    index('amenity_reservations_property_id_idx').on(table.propertyId),
    check('amenity_reservations_notes_not_blank', sql`${table.notes} is null or btrim(${table.notes}) <> ''`),
    check('amenity_reservations_amount_not_negative', sql`${table.amount} >= 0`),
    check(
      'amenity_reservations_cancellation_consistent',
      sql`(${table.cancelledAt} is null) = (${table.cancelledBy} is null)`,
    ),
  ],
)
