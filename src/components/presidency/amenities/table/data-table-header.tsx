import type { Table } from '@tanstack/react-table'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { DataTableSearch } from '@/components/shared/table/data-table-search'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Button } from '@/components/ui/button'
import { m } from '@/paraglide/messages'
import type { AmenityQueryData } from '@/tanstack-queries/presidency'
import { CreateAmenityDrawer } from '../drawer/create-amenity'

interface AmenitiesDataTableHeaderProps {
  table: Table<DataTableFeatures, AmenityQueryData>
  isLoading: boolean
}

export function AmenitiesDataTableHeader({ table, isLoading }: AmenitiesDataTableHeaderProps) {
  const canManage = useHasRole('president')
  const [isCreateOpen, setCreateOpen] = useState(false)

  return (
    <>
      <CreateAmenityDrawer open={isCreateOpen} onOpenChange={setCreateOpen} />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <div className="flex gap-2">
          <DataTableSearch
            table={table}
            columnId="name"
            param="search-amenities"
            hint={m.presidency_amenity_search_hint()}
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
            {m.presidency_new_amenity()}
          </Button>
        )}
      </div>
    </>
  )
}
