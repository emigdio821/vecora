import type { Table } from '@tanstack/react-table'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { DataTableSearch } from '@/components/shared/table/data-table-search'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Button } from '@/components/ui/button'
import type { PeriodQueryData } from '@/tanstack-queries/treasury'
import { CreatePeriodDrawer } from '../drawer/create-period'
import type { PeriodRow } from './columns'

interface PeriodsDataTableHeaderProps {
  table: Table<DataTableFeatures, PeriodRow>
  /** Newest period, if any; seeds the "Nuevo periodo" form. */
  latest: PeriodQueryData | undefined
}

export function PeriodsDataTableHeader({ table, latest }: PeriodsDataTableHeaderProps) {
  const canManage = useHasRole('treasurer', 'president')
  const [isCreateOpen, setCreateOpen] = useState(false)

  return (
    <>
      <CreatePeriodDrawer latest={latest} open={isCreateOpen} onOpenChange={setCreateOpen} />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <div className="flex gap-2">
          <DataTableSearch
            table={table}
            columnId="name"
            param="search-periods"
            hint='Buscar por nombre del periodo, por ejemplo "2026"'
          />
        </div>

        {canManage && (
          <Button
            className="self-end"
            onClick={() => {
              setCreateOpen(true)
            }}
          >
            Nuevo periodo
          </Button>
        )}
      </div>
    </>
  )
}
