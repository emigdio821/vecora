import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { DataTable } from '@/components/shared/table/data-table'
import { periodSummariesQueryOptions, periodsQueryOptions } from '@/tanstack-queries/treasury'
import { type PeriodRow, periodsTableColumns } from './columns'
import { PeriodsDataTableHeader } from './data-table-header'

export function PeriodsDataTable() {
  const { data: periods = [], isLoading, error, refetch } = useQuery(periodsQueryOptions())
  // Totals come from a view; the table renders without them and fills in when they land.
  const { data: summaries } = useQuery(periodSummariesQueryOptions())

  const rows = useMemo<PeriodRow[]>(
    () =>
      periods.map((period) => ({
        ...period,
        // The period's own currency first, then any other it has movements in.
        summaries: summaries
          ?.filter((s) => s.period_id === period.id)
          .sort((a, b) => Number(b.currency === period.currency) - Number(a.currency === period.currency)),
      })),
    [periods, summaries],
  )

  if (error) {
    return <TanstackQueryError refetch={refetch} />
  }

  return (
    <DataTable
      data={rows}
      tableId="periods"
      columns={periodsTableColumns}
      getRowId={(period) => period.id}
      initialSorting={[{ id: 'starts_on', desc: true }]}
      // The query is ordered newest first, so periods[0] is the latest.
      header={(table) => <PeriodsDataTableHeader table={table} latest={periods[0]} isLoading={isLoading} />}
      emptyMessage="Sin periodos. Crea uno para poder registrar movimientos."
      isLoading={isLoading}
    />
  )
}
