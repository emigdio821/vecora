import type { Table } from '@tanstack/react-table'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { DataTableSearch } from '@/components/shared/table/data-table-search'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Button } from '@/components/ui/button'
import type { HallReservationQueryData } from '@/tanstack-queries/presidency'
import { CreateHallReservationDrawer } from '../drawer/create-hall-reservation'

interface HallReservationsDataTableHeaderProps {
  table: Table<DataTableFeatures, HallReservationQueryData>
}

export function HallReservationsDataTableHeader({ table }: HallReservationsDataTableHeaderProps) {
  const canManage = useHasRole('president', 'treasurer')
  const [isCreateOpen, setCreateOpen] = useState(false)

  return (
    <>
      <CreateHallReservationDrawer open={isCreateOpen} onOpenChange={setCreateOpen} />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <div className="flex gap-2">
          <DataTableSearch
            table={table}
            columnId="reserved_on"
            param="search-hall"
            hint="Buscar por número de casa o notas"
          />
        </div>

        {canManage && (
          <Button
            className="self-end"
            onClick={() => {
              setCreateOpen(true)
            }}
          >
            Reservar terraza
          </Button>
        )}
      </div>
    </>
  )
}
