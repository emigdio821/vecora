import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { DataTable } from '@/components/shared/table/data-table'
import { transactionsListQueryOptions } from '@/tanstack-queries/treasury'
import { transactionsTableColumns } from './columns'
import { TransactionsDataTableHeader, useKindFilter } from './data-table-header'

export function TransactionsDataTable() {
  const { data: transactions = [], isLoading, error, refetch } = useQuery(transactionsListQueryOptions())
  const [kind] = useKindFilter()
  const canManage = useHasRole('treasurer')
  // Selection only feeds bulk delete, so readers don't get the checkboxes.
  const columns = useMemo(
    () =>
      canManage
        ? transactionsTableColumns
        : transactionsTableColumns.filter((column) => column.id !== 'select'),
    [canManage],
  )

  // Filter the data (not a column) so pagination counts only the visible kind.
  const visible = useMemo(
    () => (kind === 'all' ? transactions : transactions.filter((t) => t.kind === kind)),
    [transactions, kind],
  )

  if (error) {
    return <TanstackQueryError refetch={refetch} />
  }

  return (
    <DataTable
      data={visible}
      tableId="transactions"
      columns={columns}
      getRowId={(transaction) => transaction.id}
      initialSorting={[{ id: 'occurred_on', desc: true }]}
      header={(table) => <TransactionsDataTableHeader table={table} isLoading={isLoading} />}
      emptyMessage="Sin movimientos."
      isLoading={isLoading}
    />
  )
}
