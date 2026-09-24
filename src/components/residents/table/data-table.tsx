import { useQuery } from '@tanstack/react-query'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/shared/table/data-table'
import type { Tables } from '@/lib/supabase/database.types'
import { residentsListQueryOptions } from '@/tanstack-queries/residents'
import { residentsTableColumns } from './columns'
import { ResidentsDataTableHeader } from './data-table-header'

export type Resident = Tables<'residents'>

export function ResidentsDataTable() {
  const { data: residents = [], isLoading, error, refetch } = useQuery(residentsListQueryOptions())

  if (error) {
    return <TanstackQueryError refetch={refetch} errorDescription="Algo salió mal al cargar los residentes" />
  }

  if (isLoading) {
    return <TableGenericSkeleton />
  }

  return (
    <DataTable
      data={residents}
      tableId="residents"
      columns={residentsTableColumns}
      getRowId={(resident) => resident.id}
      header={(table) => <ResidentsDataTableHeader table={table} />}
    />
  )
}
