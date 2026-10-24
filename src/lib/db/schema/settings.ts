// The residential's own details: one row for the whole app, created by the
// first migration. Every board member reads it; the president edits it, and
// only an admin changes the language or the currency (src/lib/services/settings.ts).
import { sql } from 'drizzle-orm'
import { boolean, check, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { appLanguage, currencyCode } from './enums'

export const settings = pgTable(
  'settings',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    /** Always true and unique: there is only ever one row. */
    singleton: boolean('singleton').default(true).notNull().unique(),
    /** Shown in the sidebar and the reports. Empty: the app's generic label. */
    residentialName: text('residential_name').default('').notNull(),
    /** Language of the HOA's data and reports, and of the app for anyone who hasn't picked theirs. */
    defaultLanguage: appLanguage('default_language').default('es').notNull(),
    /** Currency of new amounts. Changing it never touches recorded ones. */
    currency: currencyCode('currency').default('MXN').notNull(),
    /** File in the storage bucket (src/lib/storage); null means no logo. */
    logoPath: text('logo_path'),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    check('settings_singleton', sql`${table.singleton}`),
    check(
      'settings_residential_name_trimmed',
      sql`${table.residentialName} = btrim(${table.residentialName})`,
    ),
  ],
)
