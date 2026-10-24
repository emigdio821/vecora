// The registry: houses, the people in the community, and who is at which
// house. The president's section.
//
// Houses and residents are soft-deleted (deletedAt / deletedBy), so a mistake
// can be undone; the nightly purge removes them after 6 months if nothing
// refers to them (src/lib/services/purge.ts). Someone who moves out isn't
// deleted: their links are history. The links themselves are hard-deleted,
// since unlinking is a normal edit.
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { RELATIONSHIPS } from '../../enums'
import { users } from './auth'

export const residencyRelationship = pgEnum('residency_relationship', RELATIONSHIPS)

export const properties = pgTable(
  'properties',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** "12B", "Casa 4". Unique among live houses, ignoring case. */
    number: text('number').notNull(),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => [
    // Among live rows only, so a number can be used again after a mistaken house is deleted.
    uniqueIndex('properties_number_unique')
      .on(sql`lower(${table.number})`)
      .where(sql`${table.deletedAt} is null`),
    check('properties_number_not_blank', sql`btrim(${table.number}) <> ''`),
  ],
)

export const residents = pgTable(
  'residents',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Their account, once they join the board. Most residents never have one. */
    userId: uuid('user_id')
      .unique()
      .references(() => users.id, { onDelete: 'set null' }),
    firstName: text('first_name').notNull(),
    lastName: text('last_name').notNull(),
    /** Not unique: relatives often share one. */
    phone: text('phone').notNull(),
    /** Optional; becomes the sign-in email if they join the board. */
    email: text('email'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => [
    uniqueIndex('residents_email_unique')
      .on(sql`lower(${table.email})`)
      .where(sql`${table.deletedAt} is null and ${table.email} is not null`),
    check('residents_first_name_not_blank', sql`btrim(${table.firstName}) <> ''`),
    check('residents_last_name_not_blank', sql`btrim(${table.lastName}) <> ''`),
    check('residents_phone_not_blank', sql`btrim(${table.phone}) <> ''`),
    check('residents_email_not_blank', sql`btrim(${table.email}) <> ''`),
  ],
)

// History ("who lived where"), so both ends restrict a hard delete.
export const propertyResidents = pgTable(
  'property_residents',
  {
    propertyId: uuid('property_id')
      .notNull()
      .references(() => properties.id, { onDelete: 'restrict' }),
    residentId: uuid('resident_id')
      .notNull()
      .references(() => residents.id, { onDelete: 'restrict' }),
    relationship: residencyRelationship('relationship').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.propertyId, table.residentId] }),
    // The primary key covers lookups by house; this one, by person.
    index('property_residents_resident_id_idx').on(table.residentId),
  ],
)
