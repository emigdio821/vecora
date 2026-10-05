import type { Table } from '@tanstack/react-table'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { DataTableSearch } from '@/components/shared/table/data-table-search'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Button } from '@/components/ui/button'
import type { CategoryQueryData } from '@/tanstack-queries/treasury'
import { CreateCategoryDrawer } from '../drawer/create-category'

interface CategoriesDataTableHeaderProps {
  table: Table<DataTableFeatures, CategoryQueryData>
  isLoading: boolean
}

export function CategoriesDataTableHeader({ table, isLoading }: CategoriesDataTableHeaderProps) {
  const canManage = useHasRole('treasurer')
  const [isCreateOpen, setCreateOpen] = useState(false)

  return (
    <>
      <CreateCategoryDrawer open={isCreateOpen} onOpenChange={setCreateOpen} />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <div className="flex gap-2">
          <DataTableSearch
            table={table}
            columnId="name"
            param="search-categories"
            hint="Buscar por nombre de la categoría"
          />
        </div>

        {canManage && (
          <Button
            className="self-end"
            disabled={isLoading}
            onClick={() => {
              setCreateOpen(true)
            }}
          >
            Nueva categoría
          </Button>
        )}
      </div>
    </>
  )
}
