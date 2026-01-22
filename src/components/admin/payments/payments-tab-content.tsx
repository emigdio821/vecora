import { useQuery } from '@tanstack/react-query'
import { paymentsListQueryOptions } from '@/api/tanstack-queries/payments'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/table/data-table'
import { paymentsTableColumns } from './table/columns'
import { PaymentsDataTableHeader } from './table/data-table-header'

export function PaymentsTabContent() {
  const { data: payments = [], isLoading, error, refetch } = useQuery(paymentsListQueryOptions())

  if (error) {
    return <TSQueryGenericError refetch={refetch} errorDescription="Algo salió mal al cargar los pagos." />
  }

  if (isLoading) {
    return <TableGenericSkeleton />
  }

  return (
    <DataTable
      data={payments}
      tableId="payments"
      columns={paymentsTableColumns}
      header={(table) => <PaymentsDataTableHeader table={table} />}
    />
  )
}
