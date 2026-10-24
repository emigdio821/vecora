// The activity log: every insert, update and delete on the app's tables,
// written by one database trigger (private.audit, in the custom migration) so
// nothing that writes can skip it, scripts included.
//
//   * actorId is who did it: the user transactionAs() names for the
//     transaction (src/lib/db/index.ts). Null for the app's own jobs (the
//     purge, migrations); the screen shows those as "Sistema".
//   * label names the row (house number, person, concept) and refs freezes
//     the names behind its foreign keys, so an entry stays readable after
//     what it points at is gone.
//   * txid groups the rows one action wrote (paying a request = the expense
//     plus the request's update).
//   * Only admins read it; nothing in the app updates or deletes it.
import { bigint, index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { AUDIT_OPERATIONS } from '../../enums'
import { users } from './auth'

export const auditOperation = pgEnum('audit_operation', AUDIT_OPERATIONS)

export const auditLog = pgTable(
  'audit_log',
  {
    id: bigint('id', { mode: 'number' }).primaryKey().generatedAlwaysAsIdentity(),
    occurredAt: timestamp('occurred_at', { withTimezone: true }).defaultNow().notNull(),
    actorId: uuid('actor_id').references(() => users.id, { onDelete: 'set null' }),
    tableName: text('table_name').notNull(),
    operation: auditOperation('operation').notNull(),
    /** The row's own id; null for tables with a composite key. */
    rowId: uuid('row_id'),
    label: text('label').notNull(),
    oldData: jsonb('old_data'),
    newData: jsonb('new_data'),
    /** Updates only: the columns whose value changed. */
    changedFields: text('changed_fields').array(),
    /** Foreign key id -> display name, frozen when written. */
    refs: jsonb('refs').default({}).notNull(),
    /** Postgres transaction id: rows sharing it were written by one action. Set by the trigger. */
    txid: bigint('txid', { mode: 'number' }).notNull(),
  },
  (table) => [
    index('audit_log_occurred_at_idx').on(table.occurredAt.desc(), table.id.desc()),
    index('audit_log_table_row_idx').on(table.tableName, table.rowId),
    index('audit_log_actor_id_idx').on(table.actorId),
  ],
)
