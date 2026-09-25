import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/shared/table/data-table'
import { transactionsListQueryOptions } from '@/tanstack-queries/treasury'
import { transactionsTableColumns } from './columns'
import { TransactionsDataTableHeader, useKindFilter } from './data-table-header'

export function TransactionsDataTable() {
  const { data: transactions = [], isLoading, error, refetch } = useQuery(transactionsListQueryOptions())
  const [kind] = useKindFilter()

  // Filter the data (not a column) so pagination counts only the visible kind.
  const visible = useMemo(
    () => (kind === 'all' ? transactions : transactions.filter((t) => t.kind === kind)),
    [transactions, kind],
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
      tableId="transactions"
      columns={transactionsTableColumns}
      getRowId={(transaction) => transaction.id}
      initialSorting={[{ id: 'occurred_on', desc: true }]}
      header={(table) => <TransactionsDataTableHeader table={table} />}
      emptyMessage="Sin movimientos."
    />
  )
}
