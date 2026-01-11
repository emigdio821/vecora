import { boolean, integer, pgEnum, pgTable, serial, text, timestamp, unique } from 'drizzle-orm/pg-core'

// Enums
export const profileTypeEnum = pgEnum('profile_type', ['owner', 'external'])
export const roleNameEnum = pgEnum('role_name', ['admin', 'maintainer', 'security', 'president', 'treasurer'])

// Auth Users table
export const authUsers = pgTable('auth_users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  disabledAt: timestamp('disabled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Owners table
export const owners = pgTable('owners', {
  id: serial('id').primaryKey(),
  identificationNumber: text('identification_number').notNull().unique(),
  address: text('address').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// External persons table
export const externalPersons = pgTable('external_persons', {
  id: serial('id').primaryKey(),
  identificationNumber: text('identification_number').notNull().unique(),
  address: text('address').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// User Profiles table
export const userProfiles = pgTable('user_profiles', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .unique()
    .references(() => authUsers.id, { onDelete: 'cascade' }),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  profileType: profileTypeEnum('profile_type').notNull(),
  profileId: integer('profile_id').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Houses table
export const houses = pgTable('houses', {
  id: serial('id').primaryKey(),
  ownerId: integer('owner_id')
    .notNull()
    .references(() => owners.id, { onDelete: 'cascade' }),
  address: text('address').notNull(),
  propertyNumber: text('property_number').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// Roles table
export const roles = pgTable('roles', {
  id: serial('id').primaryKey(),
  name: roleNameEnum('name').notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

// User Roles table (junction table)
export const userRoles = pgTable(
  'user_roles',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => authUsers.id, { onDelete: 'cascade' }),
    roleId: integer('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'cascade' }),
    assignedAt: timestamp('assigned_at').defaultNow().notNull(),
  },
  (table) => [unique('unique_user_role').on(table.userId, table.roleId)],
)
