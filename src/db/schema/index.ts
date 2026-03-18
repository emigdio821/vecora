import { relations, sql } from 'drizzle-orm'
import {
  boolean,
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
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'
import { user } from './auth'

export * from './auth'

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
  'resident',
  'house',
  'payment',
  'violation',
  'profile',
  'user',
  'hoa_board',
  'hoa_board_period',
  'notification',
  'residential_address',
])

// Residents table - unified table for all condominium residents (owners and personnel)
export const residents = pgTable('residents', {
  id: uuid('id').primaryKey().defaultRandom(),
  firstName: varchar('first_name', { length: 100 }).notNull(),
  lastName: varchar('last_name', { length: 100 }).notNull(),
  phone: varchar('phone', { length: 20 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  isOwner: boolean('is_owner').notNull().default(false),
  notes: varchar('notes', { length: 200 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

// Residential Address table - stores the common address for the condominium complex
export const residentialAddress = pgTable('residential_address', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 255 }).notNull(),
  street: varchar('street', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }).notNull(),
  state: varchar('state', { length: 100 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  country: varchar('country', { length: 100 }).default('México'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

// Houses table - represents properties owned by residents
export const houses = pgTable(
  'houses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    residentId: uuid('resident_id').references(() => residents.id, { onDelete: 'set null' }),
    houseNumber: varchar('house_number', { length: 20 }).notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('houses_residentId_idx').on(table.residentId)],
)

// Profiles - links auth users to residents
export const profiles = pgTable(
  'profiles',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    residentId: uuid('resident_id').references(() => residents.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('profiles_userId_idx').on(table.userId),
    index('profiles_residentId_idx').on(table.residentId),
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
    residentId: uuid('resident_id')
      .notNull()
      .references(() => residents.id, { onDelete: 'cascade' }),
    concept: varchar('concept', { length: 200 }).notNull(),
    amount: numeric('amount', { precision: 12, scale: 2 }).notNull(),
    violationDate: timestamp('violation_date', { withTimezone: true }).notNull(),
    status: violationStatusEnum('status').default('pending').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('violations_resident_idx').on(table.residentId),
    index('violations_status_idx').on(table.status),
    index('violations_deletedAt_idx').on(table.deletedAt),
  ],
)

// Payments table
export const payments = pgTable(
  'payments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    residentId: uuid('resident_id')
      .notNull()
      .references(() => residents.id, { onDelete: 'cascade' }),
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
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('payments_resident_idx').on(table.residentId),
    index('payments_type_idx').on(table.paymentType),
    index('payments_year_idx').on(table.year),
    index('payments_status_idx').on(table.status),
    index('payments_deletedAt_idx').on(table.deletedAt),
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

// HOA Board Periods table - defines board terms/periods
export const hoaBoardPeriods = pgTable(
  'hoa_board_periods',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    startDate: timestamp('start_date', { withTimezone: true }).notNull(),
    endDate: timestamp('end_date', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('hoa_board_periods_dates_idx').on(table.startDate, table.endDate),
    index('hoa_board_periods_deletedAt_idx').on(table.deletedAt),
    check('hoa_board_periods_dates_order', sql`${table.endDate} > ${table.startDate}`),
  ],
)

// HOA Board table - tracks which profiles are part of each board period
// Stores member names to preserve historical data even if profile is deleted
export const hoaBoard = pgTable(
  'hoa_board',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    periodId: uuid('period_id')
      .notNull()
      .references(() => hoaBoardPeriods.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    // Denormalized fields to preserve historical data
    firstName: varchar('first_name', { length: 100 }).notNull(),
    lastName: varchar('last_name', { length: 100 }).notNull(),
    email: varchar('email', { length: 255 }).notNull(),
    phone: varchar('phone', { length: 20 }).notNull(),
    role: varchar('role', { length: 50 }),
    isOwner: boolean('is_owner').notNull().default(false),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    deletedAt: timestamp('deleted_at'),
  },
  (table) => [
    index('hoa_board_periodId_idx').on(table.periodId),
    index('hoa_board_profileId_idx').on(table.profileId),
    index('hoa_board_deletedAt_idx').on(table.deletedAt),
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

// Notifications table - system notifications for users
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdBy: text('created_by')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    profileId: uuid('profile_id').references(() => profiles.id, { onDelete: 'set null' }),
    title: varchar('title', { length: 50 }).notNull(),
    message: varchar('message', { length: 200 }).notNull(),
    expiresAt: timestamp('expires_at', { withTimezone: true }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('notifications_createdBy_idx').on(table.createdBy),
    index('notifications_profileId_idx').on(table.profileId),
    index('notifications_expiresAt_idx').on(table.expiresAt),
    index('notifications_createdAt_idx').on(table.createdAt),
  ],
)

// Relations
export const residentsRelations = relations(residents, ({ many, one }) => ({
  houses: many(houses),
  violations: many(violations),
  payments: many(payments),
  profile: one(profiles, {
    fields: [residents.id],
    references: [profiles.residentId],
  }),
}))

export const housesRelations = relations(houses, ({ one }) => ({
  resident: one(residents, {
    fields: [houses.residentId],
    references: [residents.id],
  }),
}))

export const profilesRelations = relations(profiles, ({ one, many }) => ({
  user: one(user, {
    fields: [profiles.userId],
    references: [user.id],
  }),
  resident: one(residents, {
    fields: [profiles.residentId],
    references: [residents.id],
  }),
  hoaBoardMemberships: many(hoaBoard),
}))

export const violationsRelations = relations(violations, ({ one }) => ({
  resident: one(residents, {
    fields: [violations.residentId],
    references: [residents.id],
  }),
}))

export const paymentsRelations = relations(payments, ({ one, many }) => ({
  resident: one(residents, {
    fields: [payments.residentId],
    references: [residents.id],
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

export const hoaBoardPeriodsRelations = relations(hoaBoardPeriods, ({ many }) => ({
  members: many(hoaBoard),
}))

export const hoaBoardRelations = relations(hoaBoard, ({ one }) => ({
  period: one(hoaBoardPeriods, {
    fields: [hoaBoard.periodId],
    references: [hoaBoardPeriods.id],
  }),
  profile: one(profiles, {
    fields: [hoaBoard.profileId],
    references: [profiles.id],
  }),
}))

export const notificationsRelations = relations(notifications, ({ one }) => ({
  creator: one(user, {
    fields: [notifications.createdBy],
    references: [user.id],
  }),
  profile: one(profiles, {
    fields: [notifications.profileId],
    references: [profiles.id],
  }),
}))
