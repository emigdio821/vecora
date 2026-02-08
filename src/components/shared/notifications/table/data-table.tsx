import { useQuery } from '@tanstack/react-query'
import { myNotificationsListQueryOptions } from '@/api/tanstack-queries/notifications'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/table/data-table'
import { notificationsTableColumns } from './columns'
import { NotificationsDataTableHeader } from './data-table-header'

export function NotificationsDataTable() {
  const { data: notifications = [], isLoading, error, refetch } = useQuery(myNotificationsListQueryOptions())

  if (error) {
    return (
      <TSQueryGenericError
        refetch={refetch}
        errorDescription="Algo salió mal al cargar las notificaciones."
      />
    )
  }

  if (isLoading) {
    return <TableGenericSkeleton />
  }

  return (
    <DataTable
      data={notifications}
      tableId="notifications"
      columns={notificationsTableColumns}
      header={(table) => <NotificationsDataTableHeader table={table} />}
    />
  )
}
