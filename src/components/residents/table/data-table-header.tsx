import { IconTrash } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { useState } from 'react'
import { useHasRole } from '@/components/current-user-provider'
import { DataTableSearch } from '@/components/shared/table/data-table-search'
import type { DataTableFeatures } from '@/components/shared/table/features'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { type ResidentQueryData } from '@/tanstack-queries/residents'
import { DeleteResidentsAlertDialog } from '../dialog/delete-residents'
import { CreateResidentDrawer } from '../drawer/create-resident'

interface ResidentsDataTableHeaderProps {
  table: Table<DataTableFeatures, ResidentQueryData>
}

export function ResidentsDataTableHeader({ table }: ResidentsDataTableHeaderProps) {
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
            hint="Buscar por nombre, correo o teléfono"
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
                      aria-label={`Eliminar ${selectedRowsLength} residentes seleccionados`}
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
                <TooltipContent>Eliminar residentes seleccionados</TooltipContent>
              </Tooltip>
            )}

            {/* {tableRowsLength > 0 && (
            <Button variant="outline" disabled>
              <span>Exportar</span>
              {selectedRowsLength > 0 && <Badge variant="outline">{selectedRowsLength}</Badge>}
            </Button>
          )} */}

            <Button
              onClick={() => {
                setCreateResidentDrawerOpen(true)
              }}
            >
              Nuevo residente
            </Button>
          </div>
        )}
      </div>
    </>
  )
}
