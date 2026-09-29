'use client'

import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/shared/table/data-table'
import { logEntriesQueryOptions } from '@/tanstack-queries/logs'
import { entryAction, identityName } from '../entry'
import { logsTableColumns } from './columns'
import { LogsDataTableHeader } from './data-table-header'
import { useActionFilter, useIdentityFilter, useRangeFilter, useSectionFilter } from './filters'

export function LogsDataTable() {
  const [range] = useRangeFilter()
  const [section] = useSectionFilter()
  const [action] = useActionFilter()
  const [identity] = useIdentityFilter()
  const { data: entries = [], isLoading, error, refetch } = useQuery(logEntriesQueryOptions(range))

  // Filter the data (not a column) so pagination counts only the visible rows.
  const visible = useMemo(
    () =>
      entries.filter(
        (entry) =>
          (section === 'all' || entry.table_name === section) &&
          (action === 'all' || entryAction(entry) === action) &&
          (identity === 'all' || identityName(entry) === identity),
      ),
    [entries, section, action, identity],
  )

  if (error) {
    return <TanstackQueryError refetch={refetch} />
  }

  if (isLoading) {
    return <TableGenericSkeleton />
  }

  return (
    <DataTable
      data={visible}
      tableId="logs"
      columns={logsTableColumns}
      getRowId={(entry) => String(entry.id)}
      initialSorting={[{ id: 'occurred_at', desc: true }]}
      header={(table) => <LogsDataTableHeader table={table} />}
      emptyMessage="Sin cambios en estas fechas."
    />
  )
}
