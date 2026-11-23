// The registry: houses, the people in the community, who is at which house,
// and the vehicles. The president's section.
//
// Houses, residents and vehicles are soft-deleted (deletedAt / deletedBy), so
// a mistake can be undone; the nightly purge removes them after 6 months if
// nothing refers to them (src/lib/services/purge.ts). Someone who moves out
// isn't deleted: their links are history. The links themselves are
// hard-deleted, since unlinking is a normal edit. A vehicle's house is a
// column, not history: deleting the house leaves its vehicles without one.
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
import { RELATIONSHIPS, VEHICLE_KINDS } from '../../enums'
import { users } from './auth'

export const residencyRelationship = pgEnum('residency_relationship', RELATIONSHIPS)

export const vehicleKind = pgEnum('vehicle_kind', VEHICLE_KINDS)

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

// The cars and motorcycles in the community, with the RFID tag that opens the gate.
export const vehicles = pgTable(
  'vehicles',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /**
     * The house it belongs to, always a live one: none until it's assigned,
     * and none again when its house is deleted (undo assigns it back).
     */
    propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'set null' }),
    kind: vehicleKind('kind').notNull(),
    /** "RFY-420", saved in uppercase as written. */
    plate: text('plate').notNull(),
    /** The serial number of the gate's RFID tag. Optional: the tag may not be installed yet. */
    rfidSerial: text('rfid_serial'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
    deletedBy: uuid('deleted_by').references(() => users.id, { onDelete: 'set null' }),
  },
  (table) => [
    // Among live vehicles, so a deleted vehicle's plate and tag can be registered again.
    // Ignoring spaces and dashes, so "RFY-420" and "RFY 420" are the same plate.
    uniqueIndex('vehicles_plate_unique')
      .on(sql`regexp_replace(upper(${table.plate}), '[^[:alnum:]]', '', 'g')`)
      .where(sql`${table.deletedAt} is null`),
    // One tag opens the gate for one vehicle.
    uniqueIndex('vehicles_rfid_serial_unique')
      .on(sql`lower(${table.rfidSerial})`)
      .where(sql`${table.deletedAt} is null and ${table.rfidSerial} is not null`),
    index('vehicles_property_id_idx').on(table.propertyId),
    check('vehicles_plate_not_blank', sql`btrim(${table.plate}) <> ''`),
    check('vehicles_rfid_serial_not_blank', sql`btrim(${table.rfidSerial}) <> ''`),
  ],
)
