import { queryOptions } from '@tanstack/react-query'
import { addDays, parseISO } from 'date-fns'
import { fetchLogEntries } from '@/server-actions/logs'

export const LOGS_QUERY_KEY = 'logs'

export interface LogsRange {
  /** ISO day, inclusive. */
  from: string
  /** ISO day, inclusive. */
  to: string
}

export type LogEntryQueryData = Awaited<ReturnType<typeof fetchLogEntries>>[number]

/** The log only grows, so the date range is a server-side filter, not a column one. */
export function logEntriesQueryOptions(range: LogsRange) {
  return queryOptions({
    queryKey: [LOGS_QUERY_KEY, 'entries', range],
    // The days are the browser's, so they're turned into instants here, not on the server.
    queryFn: () =>
      fetchLogEntries({
        since: parseISO(range.from).toISOString(),
        until: addDays(parseISO(range.to), 1).toISOString(),
      }),
  })
}
