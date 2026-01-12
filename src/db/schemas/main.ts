import { relations } from 'drizzle-orm'
import { index, pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { user } from './auth'

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
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
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
  phone: varchar('phone', { length: 20 }),
  email: varchar('email', { length: 255 }),
  address: text('address'),
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
    ownerId: uuid('owner_id')
      .notNull()
      .references(() => owners.id, { onDelete: 'cascade' }),
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

// User Profile - links auth users to either owners or external users
// A user can be linked to EITHER an owner OR an external user, not both
export const userProfile = pgTable(
  'user_profile',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    ownerId: uuid('owner_id').references(() => owners.id, { onDelete: 'cascade' }),
    externalUserId: uuid('external_user_id').references(() => externalUsers.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('user_profile_userId_idx').on(table.userId),
    index('user_profile_ownerId_idx').on(table.ownerId),
    index('user_profile_externalUserId_idx').on(table.externalUserId),
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

// Relations
export const rolesRelations = relations(roles, ({ many }) => ({
  userRoles: many(userRoles),
}))

export const ownersRelations = relations(owners, ({ many, one }) => ({
  houses: many(houses),
  userProfile: one(userProfile, {
    fields: [owners.id],
    references: [userProfile.ownerId],
  }),
}))

export const externalUsersRelations = relations(externalUsers, ({ one }) => ({
  userProfile: one(userProfile, {
    fields: [externalUsers.id],
    references: [userProfile.externalUserId],
  }),
}))

export const housesRelations = relations(houses, ({ one }) => ({
  owner: one(owners, {
    fields: [houses.ownerId],
    references: [owners.id],
  }),
}))

export const userProfileRelations = relations(userProfile, ({ one }) => ({
  user: one(user, {
    fields: [userProfile.userId],
    references: [user.id],
  }),
  owner: one(owners, {
    fields: [userProfile.ownerId],
    references: [owners.id],
  }),
  externalUser: one(externalUsers, {
    fields: [userProfile.externalUserId],
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
