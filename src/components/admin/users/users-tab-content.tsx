// import { useQuery } from '@tanstack/react-query'
// import { externalUsersListQueryOptions } from '@/api/tanstack-queries/external-users'
// import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
// import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
// import { DataTable } from '@/components/table/data-table'

import { IconBarrierBlock } from '@tabler/icons-react'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'

export function UsersTabContent() {
  // const { data: externalUsers = [], isLoading, error, refetch } = useQuery(externalUsersListQueryOptions())

  // if (error) {
  //   return (
  //     <TSQueryGenericError
  //       refetch={refetch}
  //       errorDescription="Algo salió mal al cargar los usuarios externos."
  //     />
  //   )
  // }

  // if (isLoading) {
  //   return <TableGenericSkeleton />
  // }

  // return (
  //   <DataTable
  //     data={externalUsers}
  //     tableId="external-users"
  //     columns={externalUsersTableColumns}
  //     header={(table) => <ExternalUsersDataTableHeader table={table} />}
  //   />
  // )

  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <IconBarrierBlock />
        </EmptyMedia>
        <EmptyTitle>Nada por ahora</EmptyTitle>
        <EmptyDescription>Esta sección está en construcción.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
