import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requirePermission } from '@/lib/auth/middleware'
import { db } from '@/lib/db'

/** Instants, not days: the browser turns its own days into them, so the range follows its time zone. */
const logsWindowSchema = z.object({
  /** Inclusive. */
  since: z.iso.datetime(),
  /** Exclusive. */
  until: z.iso.datetime(),
})

export type LogsWindow = z.infer<typeof logsWindowSchema>

/** Each row carries whole row snapshots, so a wide range could outgrow a response otherwise. */
const MAX_ENTRIES = 1000

/** Any jsonb value. Spelled out because a server function can't return `unknown`. */
type Json = string | number | boolean | null | Json[] | { [key: string]: Json }

/**
 * oldData / newData: the row as it was before and after the change (jsonb), under the
 * database's column names, as the trigger wrote it.
 */
interface RowSnapshot {
  [column: string]: Json
}

/** refs: foreign key id -> display name, frozen when the entry was written (jsonb). */
type RowRefs = Record<string, string>

/** Audit rows in the window, newest first. Only admins read them (log.read). */
const fetchLogEntriesFn = createServerFn()
  .middleware([requirePermission({ log: ['read'] })])
  .validator((input: LogsWindow) => logsWindowSchema.parse(input))
  .handler(async ({ data: { since, until } }) => {
    const entries = await db.query.auditLog.findMany({
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
      // Null for the app's own jobs (no actor) or once the account is gone.
      with: { actor: { columns: { name: true } } },
      where: { occurredAt: { gte: new Date(since), lt: new Date(until) } },
      orderBy: { occurredAt: 'desc', id: 'desc' },
      limit: MAX_ENTRIES,
    })

    return entries.map((entry) => ({
      ...entry,
      oldData: entry.oldData as RowSnapshot | null,
      newData: entry.newData as RowSnapshot | null,
      refs: entry.refs as RowRefs,
    }))
  })

export const fetchLogEntries = (window: LogsWindow) => fetchLogEntriesFn({ data: window })
