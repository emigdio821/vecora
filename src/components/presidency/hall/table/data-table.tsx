import { useQuery } from '@tanstack/react-query'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { DataTable } from '@/components/shared/table/data-table'
import { hallReservationsQueryOptions } from '@/tanstack-queries/presidency'
import { hallReservationsTableColumns } from './columns'
import { HallReservationsDataTableHeader } from './data-table-header'

export function HallReservationsDataTable() {
  const { data: reservations = [], isLoading, error, refetch } = useQuery(hallReservationsQueryOptions())

  if (error) {
    return <TanstackQueryError refetch={refetch} />
  }

  return (
    <DataTable
      data={reservations}
      tableId="hall"
      columns={hallReservationsTableColumns}
      getRowId={(reservation) => reservation.id}
      initialSorting={[{ id: 'reserved_on', desc: true }]}
      header={(table) => <HallReservationsDataTableHeader table={table} isLoading={isLoading} />}
      emptyMessage="Sin reservaciones."
      isLoading={isLoading}
    />
  )
}
