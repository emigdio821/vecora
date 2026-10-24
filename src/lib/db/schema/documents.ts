// Document templates the board saves from the Notices editor, next to the
// built-in ones (those live in the app).
//
//   * Any board member saves one; only its author, or an admin, renames or
//     deletes it.
//   * The document (header, title, content) is fixed once saved; only the
//     name and the description change.
//   * content is the editor's JSON, checked by documentContentSchema before it
//     gets here. Images travel inside it, hence the size limit.
import { sql } from 'drizzle-orm'
import { check, index, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import { users } from './auth'

export const documentTemplates = pgTable(
  'document_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description').default('').notNull(),
    headerTitle: text('header_title').notNull(),
    title: text('title').notNull(),
    /** The editor's JSON (Tiptap). */
    content: jsonb('content').notNull(),
    createdBy: uuid('created_by').references(() => users.id, { onDelete: 'set null' }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true })
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    // Two templates with one name couldn't be told apart in the menu.
    uniqueIndex('document_templates_name_key').on(sql`lower(${table.name})`),
    index('document_templates_created_by_idx').on(table.createdBy),
    check('document_templates_name_length', sql`char_length(${table.name}) between 1 and 80`),
    check('document_templates_name_trimmed', sql`${table.name} = btrim(${table.name})`),
    check('document_templates_description_length', sql`char_length(${table.description}) <= 200`),
    check('document_templates_description_trimmed', sql`${table.description} = btrim(${table.description})`),
    // The editor's limits (HEADER_TITLE_MAX, TITLE_MAX).
    check('document_templates_header_title_length', sql`char_length(${table.headerTitle}) between 1 and 60`),
    check('document_templates_title_length', sql`char_length(${table.title}) between 1 and 150`),
    check('document_templates_content_is_document', sql`jsonb_typeof(${table.content}) = 'object'`),
    // The app allows 2,000,000 characters of JSON (TEMPLATE_CONTENT_MAX_LENGTH);
    // this is the backstop, with room for Postgres's spacing and two-byte letters.
    check('document_templates_content_size', sql`octet_length(${table.content}::text) <= 2500000`),
  ],
)
