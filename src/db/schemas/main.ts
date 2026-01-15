import { relations, sql } from 'drizzle-orm'
import { check, index, numeric, pgEnum, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { user } from './auth'

// Profile type enum
export const profileTypeEnum = pgEnum('profile_type', ['owner', 'external'])

// category expenses enum
export const categoryExpensesEnum = pgEnum('category_expenses', ['security', 'maintenance', 'other'])

// violation enum
export const violationStatusEnum = pgEnum('violation_status', ['pending', 'paid'])

// payment type enum
export const paymentTypeEnum = pgEnum('payment_type', ['monthly_fee', 'violation'])

// payment status enum
export const paymentStatusEnum = pgEnum('payment_status', ['pending', 'paid'])

// Roles table - defines all available roles in the system
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  description: text('description'),
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
  email: varchar('email', { length: 255 }).notNull(),
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
  email: varchar('email', { length: 255 }).notNull(),
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
    houseNumber: varchar('house_number', { length: 20 }).notNull(),
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

// User Roles - junction table for many-to-many relationship between users and roles
export const userRoles = pgTable(
  'user_roles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (table) => [
    index('user_roles_userId_idx').on(table.userId),
    index('user_roles_roleId_idx').on(table.roleId),
  ],
)

// Expenses table
export const expenses = pgTable(
  'expenses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    concept: text('concept'),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    categoryExpenses: categoryExpensesEnum('category_expenses').notNull(),
    expenseDate: timestamp('expense_date', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
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
    concept: text('concept').notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    violationDate: timestamp('violation_date', { withTimezone: true }).notNull(),
    status: violationStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
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
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    paymentType: paymentTypeEnum('payment_type').notNull(),
    // Example: "2026-01"
    month: varchar('month', { length: 7 }).notNull(),
    status: paymentStatusEnum('status').default('pending').notNull(),
    paidAt: timestamp('paid_at', { withTimezone: true }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('payments_owner_idx').on(table.ownerId),
    index('payments_type_idx').on(table.paymentType),
    index('payments_month_idx').on(table.month),
    index('payments_status_idx').on(table.status),
  ],
)

// Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
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

export const profilesRelations = relations(profiles, ({ one }) => ({
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
}))

export const userRolesRelations = relations(userRoles, ({ one }) => ({
  user: one(user, {
    fields: [userRoles.userId],
    references: [user.id],
  }),
  role: one(roles, {
    fields: [userRoles.roleId],
    references: [roles.id],
  }),
}))

export const violationsRelations = relations(violations, ({ one }) => ({
  owner: one(owners, {
    fields: [violations.ownerId],
    references: [owners.id],
  }),
}))

export const paymentsRelations = relations(payments, ({ one }) => ({
  owner: one(owners, {
    fields: [payments.ownerId],
    references: [owners.id],
  }),
}))
