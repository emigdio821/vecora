import { useQuery } from '@tanstack/react-query'
import { TanstackQueryError } from '@/components/shared/errors/tanstack-query'
import { DataTable } from '@/components/shared/table/data-table'
import { m } from '@/paraglide/messages'
import { categoriesQueryOptions } from '@/tanstack-queries/treasury'
import { categoriesTableColumns } from './columns'
import { CategoriesDataTableHeader } from './data-table-header'

export function CategoriesDataTable() {
  const { data: categories = [], isLoading, error, refetch } = useQuery(categoriesQueryOptions())

  if (error) {
    return <TanstackQueryError refetch={refetch} />
  }

  return (
    <DataTable
      data={categories}
      tableId="categories"
      columns={categoriesTableColumns}
      getRowId={(category) => category.id}
      // No initial sort: the query already orders income first, then by name.
      header={(table) => <CategoriesDataTableHeader table={table} isLoading={isLoading} />}
      emptyMessage={m.treasury_categories_empty()}
      isLoading={isLoading}
    />
  )
}
