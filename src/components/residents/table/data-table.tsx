import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { DataTable } from '@/components/shared/table/data-table'
import type { Tables } from '@/lib/supabase/database.types'
import { residentsListQueryOptions } from '@/tanstack-queries/residents'
import { residentsTableColumns } from './columns'
import { ResidentsDataTableHeader } from './data-table-header'

export type Resident = Tables<'residents'>

export function ResidentsDataTable() {
  const { data: residents = [], isLoading, error, refetch } = useQuery(residentsListQueryOptions())
  const canManage = useHasRole('president')
  // Selection only feeds bulk delete, so readers don't get the checkboxes.
  const columns = useMemo(
    () =>
      canManage ? residentsTableColumns : residentsTableColumns.filter((column) => column.id !== 'select'),
    [canManage],
  )

  if (error) {
    return <TanstackQueryError refetch={refetch} />
  }

  return (
    <DataTable
      data={residents}
      tableId="residents"
      columns={columns}
      getRowId={(resident) => resident.id}
      header={(table) => <ResidentsDataTableHeader table={table} isLoading={isLoading} />}
      isLoading={isLoading}
    />
  )
}
