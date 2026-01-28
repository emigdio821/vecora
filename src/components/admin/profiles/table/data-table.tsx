import { useQuery } from '@tanstack/react-query'
import { profilesListQueryOptions } from '@/api/tanstack-queries/profiles'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/table/data-table'
import { profilesTableColumns } from './columns'

export function ProfilesDataTable() {
  const { data: profiles = [], isLoading, error, refetch } = useQuery(profilesListQueryOptions())

  console.log('ProfilesDataTable profiles:', profiles)

  if (error) {
    return <TSQueryGenericError refetch={refetch} errorDescription="Algo salió mal al cargar los perfiles." />
  }

  if (isLoading) {
    return <TableGenericSkeleton />
  }

  return (
    <DataTable
      data={profiles}
      tableId="profiles"
      columns={profilesTableColumns}
      caption={`Estos perfiles representan a los usuarios registrados en el sistema.
        Puedes vincular un perfil aun propietario o un usuario externo.
      `}
      // header={(table) => <ExternalUsersDataTableHeader table={table} />}
    />
  )
}
