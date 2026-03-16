import { IconFileExport, IconInfoCircle, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { deleteHouse } from '@/api/server-functions/houses'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { HOUSES_QUERY_KEY, type HouseQueryData } from '@/api/tanstack-queries/houses'
import { AlertDialogGeneric } from '@/components/shared/alert-dialog-generic'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useBulkDelete } from '@/hooks/use-bulk-delete'
import { CreateHouseSheet } from '../sheets/create-house'

interface HousesDataTableHeaderProps {
  table: Table<HouseQueryData>
}

export function HousesDataTableHeader({ table }: HousesDataTableHeaderProps) {
  const [openCreateOwnerDialog, setOpenCreateOwnerDialog] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-houses', parseAsString.withDefault(''))
  const tableRowsLength = table.getCoreRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length

  const bulkDeleteMutation = useBulkDelete({
    table,
    successTitle: 'Casas eliminadas',
    successDescription: 'Las casas seleccionadas han sido eliminadas exitosamente.',
    deleteFn: async (house) => {
      await deleteHouse({ data: { houseId: house.id } })
    },
    invalidateKeys: [HOUSES_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  async function handleBatchDelete() {
    await bulkDeleteMutation.mutateAsync()
  }

  useEffect(() => {
    table.getColumn('houseNumber')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <>
      <AlertDialogGeneric
        state={{
          isOpen: isDeleteDialogOpen,
          onOpenChange: setDeleteDialogOpen,
        }}
        action={handleBatchDelete}
        variant="destructive"
        actionLabel="Eliminar"
        title="¿Eliminar casa?"
        description={
          <div>
            <p>
              Casas seleccionadas: <strong>{selectedRowsLength}</strong>.
            </p>
            <p>Esta acción no se puede deshacer.</p>
          </div>
        }
      />

      <CreateHouseSheet state={{ isOpen: openCreateOwnerDialog, onOpenChange: setOpenCreateOwnerDialog }} />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <InputGroup className="w-full bg-background sm:w-sm">
          <InputGroupInput
            type="search"
            value={searchQuery}
            aria-label="Buscar"
            placeholder="Buscar"
            name="search-houses"
            disabled={tableRowsLength === 0}
            onChange={(e) => setSearchQuery(e.target.value || null)}
          />
          <InputGroupAddon>
            <IconSearch />
          </InputGroupAddon>

          <InputGroupAddon align="inline-end">
            <Tooltip open={isSearchTooltipOpen} onOpenChange={setSearchTooltipOpen}>
              <TooltipTrigger
                render={
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    className="cursor-default"
                    onClick={(e) => {
                      e.preventBaseUIHandler()
                      setSearchTooltipOpen(true)
                    }}
                  >
                    <IconInfoCircle className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Buscar por número de casa o propietario</TooltipContent>
            </Tooltip>
          </InputGroupAddon>
        </InputGroup>

        <div className="flex gap-2">
          {selectedRowsLength > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="icon"
                    variant="destructive"
                    aria-label="Borrar casas seleccionadas"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <IconTrash className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Eliminar casas seleccionadas</TooltipContent>
            </Tooltip>
          )}

          {tableRowsLength > 0 && (
            <Button variant="outline" disabled>
              <IconFileExport className="size-4" />
              <span>Exportar</span>
              {selectedRowsLength > 0 && <Badge variant="outline">{selectedRowsLength}</Badge>}
            </Button>
          )}

          <Button onClick={() => setOpenCreateOwnerDialog(true)}>
            <IconPlus className="size-4" />
            Crear
          </Button>
        </div>
      </div>
    </>
  )
}
