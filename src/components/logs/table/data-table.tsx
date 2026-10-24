import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { DataTable } from '@/components/shared/table/data-table'
import { m } from '@/paraglide/messages'
import { type LogEntryQueryData, logEntriesQueryOptions } from '@/tanstack-queries/logs'
import { entryAction, actorName } from '../entry'
import { logsTableColumns } from './columns'
import { LogsDataTableHeader } from './data-table-header'
import { useActionFilter, useIdentityFilter, useRangeFilter, useSectionFilter } from './filters'

// Same array on every render while loading, so the table doesn't recompute its rows.
const EMPTY_ENTRIES: LogEntryQueryData[] = []

export function LogsDataTable() {
  const [range] = useRangeFilter()
  const [section] = useSectionFilter()
  const [action] = useActionFilter()
  const [identity] = useIdentityFilter()
  const { data: entries = EMPTY_ENTRIES, isLoading, error, refetch } = useQuery(logEntriesQueryOptions(range))

  // Filter the data (not a column) so pagination counts only the visible rows.
  const visible = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (section === 'all' || entry.tableName === section) &&
          (action === 'all' || entryAction(entry) === action) &&
          (identity === 'all' || actorName(entry) === identity),
      ),
    [entries, section, action, identity],
  )

  if (error) {
    return <TanstackQueryError refetch={refetch} />
  }

  return (
    <DataTable
      data={visible}
      tableId="logs"
      columns={logsTableColumns}
      getRowId={(entry) => String(entry.id)}
      initialSorting={[{ id: 'occurredAt', desc: true }]}
      header={(table) => <LogsDataTableHeader table={table} />}
      emptyMessage={m.logs_empty()}
      isLoading={isLoading}
    />
  )
}
