// Better Auth's tables, as its Drizzle schema generator writes them for this
// app's options (src/lib/auth/index.ts): the admin plugin's role and ban
// columns, magic-link tokens in verifications, the rate limiter in the
// database, and the fields the app adds (marked below). Timestamps are
// timestamptz, the rest is the generator's.
//
// A change to the auth options can change these tables: run the generator
// again (see README) and compare.
import { sql } from 'drizzle-orm'
import {
  bigint,
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import { APP_ROLES } from '../../auth/roles'

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    image: text('image'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    // admin plugin. Board roles, comma-separated ("president,treasurer"). Null
    // or empty: not on the board, so no sign-in (src/lib/auth/index.ts).
    role: text('role'),
    banned: boolean('banned').default(false),
    banReason: text('ban_reason'),
    banExpires: timestamp('ban_expires', { withTimezone: true }),
    // The app's own fields.
    /** The app's own account (admin@vecora.app): can't be deleted, renamed or lose the admin role. */
    isMainAdmin: boolean('is_main_admin').default(false).notNull(),
    /** Still on the default password the setup gave it; the app allows nothing but choosing a new one. */
    mustChangePassword: boolean('must_change_password').default(false).notNull(),
    /** When the user closed the welcome dialog; on the account, so it follows them to every device. */
    welcomedAt: timestamp('welcomed_at', { withTimezone: true }),
  },
  (table) => [
    uniqueIndex('users_one_main_admin')
      .on(table.isMainAdmin)
      .where(sql`${table.isMainAdmin}`),
    check('users_email_lowercase', sql`${table.email} = lower(${table.email})`),
    check(
      'users_role_valid',
      sql`${table.role} is null or ${table.role} = '' or string_to_array(${table.role}, ',') <@ array[${sql.raw(
        APP_ROLES.map((role) => `'${role}'`).join(', '),
      )}]`,
    ),
  ],
)

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    // admin plugin.
    impersonatedBy: text('impersonated_by'),
    // The app's own field. Opened with an access link, and no password chosen
    // since: such a session may only choose one.
    fromAccessLink: boolean('from_access_link').default(false).notNull(),
  },
  (table) => [index('sessions_user_id_idx').on(table.userId)],
)

// One row per sign-in method. Only passwords ("credential") are used; the
// token columns are for social sign-in, which Better Auth expects anyway.
export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at', { withTimezone: true }),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at', { withTimezone: true }),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('accounts_user_id_idx').on(table.userId)],
)

// One-time tokens: the access links.
export const verifications = pgTable(
  'verifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)],
)

// The rate limiter's counters. In the database rather than in memory: every
// Vercel function instance would keep its own count.
export const rateLimits = pgTable('rate_limits', {
  id: uuid('id').defaultRandom().primaryKey(),
  key: text('key').notNull().unique(),
  count: integer('count').notNull(),
  lastRequest: bigint('last_request', { mode: 'number' }).notNull(),
})
