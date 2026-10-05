import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { DataTable } from '@/components/shared/table/data-table'
import { housesListQueryOptions } from '@/tanstack-queries/houses'
import { housesTableColumns } from './columns'
import { HousesDataTableHeader } from './data-table-header'

export function HousesDataTable() {
  const { data: houses = [], isLoading, error, refetch } = useQuery(housesListQueryOptions())
  const canManage = useHasRole('president')
  // Selection only feeds bulk delete, so readers don't get the checkboxes.
  const columns = useMemo(
    () => (canManage ? housesTableColumns : housesTableColumns.filter((column) => column.id !== 'select')),
    [canManage],
  )

  if (error) {
    return <TanstackQueryError refetch={refetch} />
  }

  return (
    <DataTable
      data={houses}
      tableId="houses"
      columns={columns}
      getRowId={(house) => house.id}
      initialSorting={[{ id: 'number', desc: false }]}
      header={(table) => <HousesDataTableHeader table={table} isLoading={isLoading} />}
      isLoading={isLoading}
    />
  )
}
