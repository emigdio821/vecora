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
import { type ResidentQueryData } from '@/tanstack-queries/residents'
import { DeleteResidentsAlertDialog } from '../dialog/delete-residents'
import { CreateResidentDrawer } from '../drawer/create-resident'

interface ResidentsDataTableHeaderProps {
  table: Table<DataTableFeatures, ResidentQueryData>
  isLoading: boolean
}

export function ResidentsDataTableHeader({ table, isLoading }: ResidentsDataTableHeaderProps) {
  const canManage = useHasRole('president')
  const [isCreateResidentDrawerOpen, setCreateResidentDrawerOpen] = useState(false)
  const [isDeleteSelectedOpen, setDeleteSelectedOpen] = useState(false)
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length
  const selectedResidents = selectedRows.map((row) => row.original)

  return (
    <>
      <CreateResidentDrawer open={isCreateResidentDrawerOpen} onOpenChange={setCreateResidentDrawerOpen} />
      <DeleteResidentsAlertDialog
        residents={selectedResidents}
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
            columnId="name"
            param="search-residents"
            hint={m.residential_search_residents_hint()}
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
                      aria-label={m.residential_delete_selected_residents_label({
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
                <TooltipContent>{m.residential_delete_selected_residents()}</TooltipContent>
              </Tooltip>
            )}

            {/* {tableRowsLength > 0 && (
            <Button variant="outline" disabled>
              <span>Exportar</span>
              {selectedRowsLength > 0 && <Badge variant="outline">{selectedRowsLength}</Badge>}
            </Button>
          )} */}

            <Button
              disabled={isLoading}
              onClick={() => {
                setCreateResidentDrawerOpen(true)
              }}
            >
              {m.residential_new_resident()}
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
