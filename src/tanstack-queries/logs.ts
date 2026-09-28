import type { QueryData } from '@supabase/supabase-js'
import { queryOptions } from '@tanstack/react-query'
import { addDays, parseISO } from 'date-fns'
import { createClient } from '@/lib/supabase/client'

export const LOGS_QUERY_KEY = 'logs'

export interface LogsRange {
  /** ISO day, inclusive. */
  from: string
  /** ISO day, inclusive. */
  to: string
}

/** The log only grows, so the date range is a server-side filter, not a column one. */
function entriesQuery({ from, to }: LogsRange) {
  return createClient()
    .from('audit_log')
    .select(
      `
      id, occurred_at, table_name, operation, row_id, label, old_data, new_data, changed_fields, refs, txid,
      identity:profiles!identity_id ( full_name )
      `,
    )
    .gte('occurred_at', parseISO(from).toISOString())
    .lt('occurred_at', addDays(parseISO(to), 1).toISOString())
    .order('occurred_at', { ascending: false })
    .order('id', { ascending: false })
}

export type LogEntryQueryData = QueryData<ReturnType<typeof entriesQuery>>[number]

export function logEntriesQueryOptions(range: LogsRange) {
  return queryOptions({
    queryKey: [LOGS_QUERY_KEY, 'entries', range],
    queryFn: async () => {
      const { data, error } = await entriesQuery(range)
      if (error) throw error
      return data
    },
  })
}
