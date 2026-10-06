import { IconTrash } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { DataTableSearch } from '@/components/shared/table/data-table-search'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { m } from '@/paraglide/messages'
import type { HouseQueryData } from '@/tanstack-queries/houses'
import { DeleteHousesAlertDialog } from '../dialog/delete-houses'
import { CreateHouseDrawer } from '../drawer/create-house'

interface HousesDataTableHeaderProps {
  table: Table<DataTableFeatures, HouseQueryData>
  isLoading: boolean
}

export function HousesDataTableHeader({ table, isLoading }: HousesDataTableHeaderProps) {
  const canManage = useHasRole('president')
  const [isCreateOpen, setCreateOpen] = useState(false)
  const [isDeleteSelectedOpen, setDeleteSelectedOpen] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length
  const selectedHouses = selectedRows.map((row) => row.original)

  return (
    <>
      <CreateHouseDrawer open={isCreateOpen} onOpenChange={setCreateOpen} />
      <DeleteHousesAlertDialog
        houses={selectedHouses}
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
            columnId="number"
            param="search-houses"
            hint={m.residential_search_houses_hint()}
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
                      aria-label={m.residential_delete_selected_houses_label({ count: selectedRowsLength })}
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
                <TooltipContent>{m.residential_delete_selected_houses()}</TooltipContent>
              </Tooltip>
            )}

            <Button
              disabled={isLoading}
              onClick={() => {
                setCreateOpen(true)
              }}
            >
              {m.residential_new_house()}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
