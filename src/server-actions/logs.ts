import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { authMiddleware } from '@/lib/auth/middleware'
import { withCurrentUser } from '@/lib/db/current-user'

/** Instants, not days: the browser turns its own days into them, so the range follows its time zone. */
const logsWindowSchema = z.object({
  /** Inclusive. */
  since: z.iso.datetime(),
  /** Exclusive. */
  until: z.iso.datetime(),
})

export type LogsWindow = z.infer<typeof logsWindowSchema>

/**
 * As many rows as Supabase's API used to return at most. Each row carries
 * whole row snapshots, so a wide range could outgrow a response otherwise.
 */
const MAX_ENTRIES = 1000

/** Any jsonb value. Spelled out because a server function can't return `unknown`. */
type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

/** old_data / new_data: the row as it was before and after the change (jsonb). */
interface RowSnapshot {
  [column: string]: Json
}

/** refs: foreign key id -> display name, frozen when the entry was written (jsonb). */
type RowRefs = Record<string, string>

/**
 * Audit rows in the window, newest first (only admins can read them). The rows
 * keep the database's column names and ISO timestamps, the shape the screens were built on.
 */
const fetchLogEntriesFn = createServerFn()
  .middleware([authMiddleware])
  .validator((input: LogsWindow) => logsWindowSchema.parse(input))
  .handler(async ({ data: { since, until } }) => {
    const entries = await withCurrentUser((tx) =>
      tx.query.auditLog.findMany({
        columns: {
          id: true,
          occurredAt: true,
          tableName: true,
          operation: true,
          rowId: true,
          label: true,
          oldData: true,
          newData: true,
          changedFields: true,
          refs: true,
          txid: true,
        },
        with: { profile: { columns: { fullName: true } } },
        where: { occurredAt: { gte: new Date(since), lt: new Date(until) } },
        orderBy: { occurredAt: 'desc', id: 'desc' },
        limit: MAX_ENTRIES,
      }),
    )

    return entries.map((entry) => ({
      id: entry.id,
      occurred_at: entry.occurredAt.toISOString(),
      table_name: entry.tableName,
      operation: entry.operation,
      row_id: entry.rowId,
      label: entry.label,
      old_data: entry.oldData as RowSnapshot | null,
      new_data: entry.newData as RowSnapshot | null,
      changed_fields: entry.changedFields,
      refs: entry.refs as RowRefs,
      txid: entry.txid,
      // Null when no user was signed in (triggers, jobs, seeds) or the account is gone.
      identity: entry.profile ? { full_name: entry.profile.fullName } : null,
    }))
  })

export const fetchLogEntries = (window: LogsWindow) => fetchLogEntriesFn({ data: window })
