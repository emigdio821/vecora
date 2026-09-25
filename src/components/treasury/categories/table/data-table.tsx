import { useQuery } from '@tanstack/react-query'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { TableGenericSkeleton } from '@/components/shared/skeletons/table-generic'
import { DataTable } from '@/components/shared/table/data-table'
import { categoriesQueryOptions } from '@/tanstack-queries/treasury'
import { categoriesTableColumns } from './columns'
import { CategoriesDataTableHeader } from './data-table-header'

export function CategoriesDataTable() {
  const { data: categories = [], isLoading, error, refetch } = useQuery(categoriesQueryOptions())

  if (error) {
    return <TanstackQueryError refetch={refetch} />
  }

  if (isLoading) {
    return <TableGenericSkeleton />
  }

  return (
    <DataTable
      data={categories}
      tableId="categories"
      columns={categoriesTableColumns}
      getRowId={(category) => category.id}
      // No initial sort: the query already orders income first, then by name.
      header={(table) => <CategoriesDataTableHeader table={table} />}
      emptyMessage="Sin categorías."
    />
  )
}
