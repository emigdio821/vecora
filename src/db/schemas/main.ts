import { relations, sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { user } from './auth'

// Profile type enum
export const profileTypeEnum = pgEnum('profile_type', ['owner', 'external'])

// category expenses enum
export const categoryExpensesEnum = pgEnum('category_expenses', ['security', 'maintenance', 'other'])

// violation enum
export const violationStatusEnum = pgEnum('violation_status', ['pending', 'paid'])

// payment type enum
export const paymentTypeEnum = pgEnum('payment_type', ['monthly_fee', 'extra', 'other'])

// payment status enum
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid'])

// audit logs action enum
export const auditLogActionEnum = pgEnum('audit_log_action', ['create', 'update', 'delete'])

// audit logs entity type enum
export const auditLogEntityTypeEnum = pgEnum('audit_log_entity_type', [
  'external_user',
  'owner',
  'house',
  'payment',
  'violation',
  'profile',
  'user',
])

// Roles table - defines all available roles in the system
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: varchar('description', { length: 200 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

// Owners table - represents property owners
export const owners = pgTable('owners', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

// External Users table - represents non-owner personnel (e.g., external managers)
export const externalUsers = pgTable('external_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  notes: varchar('notes', { length: 200 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

// Houses table - represents properties owned by owners
export const houses = pgTable(
  'houses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id').references(() => owners.id, { onDelete: 'set null' }),
    houseNumber: varchar('house_number', { length: 20 }).notNull().unique(),
    street: varchar('street', { length: 255 }),
    city: varchar('city', { length: 100 }),
    state: varchar('state', { length: 100 }),
    zipCode: varchar('zip_code', { length: 20 }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('houses_ownerId_idx').on(table.ownerId)],
)

// Profiles - links auth users to either owners or external users
// Must have EITHER ownerId OR externalUserId set, not both or neither
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    profileType: profileTypeEnum('profile_type').notNull(),
    ownerId: uuid('owner_id').references(() => owners.id, { onDelete: 'cascade' }),
    externalUserId: uuid('external_user_id').references(() => externalUsers.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('profiles_userId_idx').on(table.userId),
    index('profiles_ownerId_idx').on(table.ownerId),
    index('profiles_externalUserId_idx').on(table.externalUserId),
    check(
      'profile_type_constraint',
      sql`(
        (${table.profileType} = 'owner' AND ${table.ownerId} IS NOT NULL AND ${table.externalUserId} IS NULL)
        OR
        (${table.profileType} = 'external' AND ${table.ownerId} IS NULL AND ${table.externalUserId} IS NOT NULL)
      )`,
    ),
  ],
)

// Profile Roles - junction table for many-to-many relationship between profiles and roles
export const profileRoles = pgTable(
  'profile_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    profileId: uuid('profile_id')
      .notNull()
      .references(() => profiles.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('profile_roles_profileId_idx').on(table.profileId),
    index('profile_roles_roleId_idx').on(table.roleId),
    unique('profile_roles_unique').on(table.profileId, table.roleId),
  ],
)

// Expenses table
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    concept: varchar('concept', { length: 200 }),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    categoryExpenses: categoryExpensesEnum('category_expenses').notNull(),
    expenseDate: timestamp('expense_date', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('expenses_category_idx').on(table.categoryExpenses),
    index('expenses_expense_date_idx').on(table.expenseDate),
  ],
)

// Violations table
export const violations = pgTable(
  'violations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => owners.id, { onDelete: 'cascade' }),
    concept: varchar('concept', { length: 200 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    violationDate: timestamp('violation_date', { withTimezone: true }).notNull(),
    status: violationStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('violations_owner_idx').on(table.ownerId),
    index('violations_status_idx').on(table.status),
  ],
)

// Payments table
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => owners.id, { onDelete: 'cascade' }),
    concept: varchar('concept', { length: 200 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    paymentType: paymentTypeEnum('payment_type').notNull(),
    year: integer('year').notNull(),
    status: paymentStatusEnum('status').default('pending').notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('payments_owner_idx').on(table.ownerId),
    index('payments_type_idx').on(table.paymentType),
    index('payments_year_idx').on(table.year),
    index('payments_status_idx').on(table.status),
  ],
)

// Payment months junction table - links payments to months (1-12)
export const paymentMonths = pgTable(
  'payment_months',
  {
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),
    month: integer('month').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.paymentId, table.month] }),
    index('payment_months_payment_idx').on(table.paymentId),
    check('month_range', sql`${table.month} BETWEEN 1 AND 12`),
  ],
)

// Audit Logs table - tracks all admin actions for compliance and security
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id').references(() => user.id, { onDelete: 'set null' }),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    action: auditLogActionEnum('action').notNull(),
    entityType: auditLogEntityTypeEnum('entity_type').notNull(),
    entityId: uuid('entity_id'),
    entityUserId: text('entity_user_id').references(() => user.id, { onDelete: 'set null' }),
    // biome-ignore lint/complexity/noBannedTypes: TODO: review usage of unknown
    changes: jsonb('changes').$type<{}>(), // Stores { old: {...}, new: {...} }
    ipAddress: varchar('ip_address', { length: 45 }),
    userAgent: text('user_agent'),
    timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('audit_logs_userId_idx').on(table.userId),
    index('audit_logs_profileId_idx').on(table.profileId),
    index('audit_logs_entityType_idx').on(table.entityType),
    index('audit_logs_entityId_idx').on(table.entityId),
    index('audit_logs_entityUserId_idx').on(table.entityUserId),
    index('audit_logs_timestamp_idx').on(table.timestamp),
  ],
)

// Payment History table - tracks status changes for payments
export const paymentHistory = pgTable(
  'payment_history',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    paymentId: uuid('payment_id')
      .notNull()
      .references(() => payments.id, { onDelete: 'cascade' }),
    previousStatus: paymentStatusEnum('previous_status').notNull(),
    newStatus: paymentStatusEnum('new_status').notNull(),
    changedBy: text('changed_by').references(() => user.id, { onDelete: 'set null' }),
    notes: varchar('notes', { length: 200 }),
    changedAt: timestamp('changed_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('payment_history_paymentId_idx').on(table.paymentId),
    index('payment_history_changedBy_idx').on(table.changedBy),
    index('payment_history_changedAt_idx').on(table.changedAt),
  ],
)

// Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  profileRoles: many(profileRoles),
}))

export const ownersRelations = relations(owners, ({ many, one }) => ({
  houses: many(houses),
  violations: many(violations),
  payments: many(payments),
  profile: one(profiles, {
    fields: [owners.id],
    references: [profiles.ownerId],
  }),
}))

export const externalUsersRelations = relations(externalUsers, ({ one }) => ({
  profile: one(profiles, {
    fields: [externalUsers.id],
    references: [profiles.externalUserId],
  }),
}))

export const housesRelations = relations(houses, ({ one }) => ({
  owner: one(owners, {
    fields: [houses.ownerId],
    references: [owners.id],
  }),
}))

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(user, {
    fields: [profiles.userId],
    references: [user.id],
  }),
  owner: one(owners, {
    fields: [profiles.ownerId],
    references: [owners.id],
  }),
  externalUser: one(externalUsers, {
    fields: [profiles.externalUserId],
    references: [externalUsers.id],
  }),
  profileRoles: many(profileRoles),
}))

export const profileRolesRelations = relations(profileRoles, ({ one }) => ({
  profile: one(profiles, {
    fields: [profileRoles.profileId],
    references: [profiles.id],
  }),
  role: one(roles, {
    fields: [profileRoles.roleId],
    references: [roles.id],
  }),
}))

export const violationsRelations = relations(violations, ({ one }) => ({
  owner: one(owners, {
    fields: [violations.ownerId],
    references: [owners.id],
  }),
}))

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  owner: one(owners, {
    fields: [payments.ownerId],
    references: [owners.id],
  }),
  paymentMonths: many(paymentMonths),
  paymentHistory: many(paymentHistory),
}))

export const paymentMonthsRelations = relations(paymentMonths, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentMonths.paymentId],
    references: [payments.id],
  }),
}))

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(user, {
    fields: [auditLogs.userId],
    references: [user.id],
  }),
  profile: one(profiles, {
    fields: [auditLogs.profileId],
    references: [profiles.id],
  }),
  entityUser: one(user, {
    fields: [auditLogs.entityUserId],
    references: [user.id],
  }),
}))

export const paymentHistoryRelations = relations(paymentHistory, ({ one }) => ({
  payment: one(payments, {
    fields: [paymentHistory.paymentId],
    references: [payments.id],
  }),
  changedByUser: one(user, {
    fields: [paymentHistory.changedBy],
    references: [user.id],
  }),
}))
