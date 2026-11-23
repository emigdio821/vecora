import { IconTrash } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { useState } from 'react'
import { useCan } from '@/components/current-user-provider'
import { DataTableSearch } from '@/components/shared/table/data-table-search'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { m } from '@/paraglide/messages'
import type { VehicleQueryData } from '@/tanstack-queries/vehicles'
import { DeleteVehiclesAlertDialog } from '../dialog/delete-vehicles'
import { VehicleDrawer } from '../drawer/vehicle-drawer'

interface VehiclesDataTableHeaderProps {
  table: Table<DataTableFeatures, VehicleQueryData>
  isLoading: boolean
}

export function VehiclesDataTableHeader({ table, isLoading }: VehiclesDataTableHeaderProps) {
  const canManage = useCan({ registry: ['write'] })
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [isDeleteSelectedOpen, setDeleteSelectedOpen] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length
  const selectedVehicles = selectedRows.map((row) => row.original)

  return (
    <>
      <VehicleDrawer open={isCreateOpen} onOpenChange={setCreateOpen} />
      <DeleteVehiclesAlertDialog
        vehicles={selectedVehicles}
        open={isDeleteSelectedOpen}
        onOpenChange={setDeleteSelectedOpen}
        onDeleted={() => {
          table.resetRowSelection()
        }}
      />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <div className="flex gap-2">
          <DataTableSearch
            table={table}
            columnId="plate"
            param="search-vehicles"
            hint={m.residential_search_vehicles_hint()}
          />
        </div>

        {canManage && (
          <div className="flex justify-end gap-2">
            {selectedRowsLength > 0 && (
              <Tooltip>
                <TooltipTrigger
                  closeOnClick={false}
                  render={
                    <Button
                      variant="destructive-outline"
                      aria-label={m.residential_delete_selected_vehicles_label({
                        count: selectedRowsLength,
                      })}
                      onClick={() => {
                        setDeleteSelectedOpen(true)
                      }}
                    >
                      <IconTrash className="size-4" />
                      <Badge variant="error" size="sm" aria-hidden>
                        {selectedRowsLength}
                      </Badge>
                    </Button>
                  }
                />
                <TooltipContent>{m.residential_delete_selected_vehicles()}</TooltipContent>
              </Tooltip>
            )}

            <Button
              disabled={isLoading}
              onClick={() => {
                setCreateOpen(true)
              }}
            >
              {m.residential_new_vehicle()}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
