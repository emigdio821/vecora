import { IconFileExport, IconInfoCircle, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Table } from '@tanstack/react-table'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { LoaderIcon } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogClose,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogPopup,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { toastManager } from '@/components/ui/toast'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { HouseWithOwner } from '@/db/schemas/zod'
import { OWNERS_QUERY_KEY } from '@/lib/ts-queries/owners'
import { deleteOwner } from '@/server-fns/owners'
import { CreateHouseSheet } from '../sheets/create-house'

interface HousesDataTableHeaderProps {
  table: Table<HouseWithOwner>
}

export function HousesDataTableHeader({ table }: HousesDataTableHeaderProps) {
  const [openCreateOwnerDialog, setOpenCreateOwnerDialog] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-houses', parseAsString.withDefault(''))
  const queryClient = useQueryClient()
  const tableRowsLength = table.getCoreRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length
  const selectedHouses = selectedRows.map((row) => row.original)

  const batchDeleteMutation = useMutation({
    mutationFn: async () => {
      // TODO: Implement delete house server function
      const results = await Promise.allSettled(
        selectedHouses.map((house) => deleteOwner({ data: { ownerId: house.id } })),
      )

      const fulfilled = results.filter((r) => r.status === 'fulfilled').length
      const rejected = results.filter((r) => r.status === 'rejected').length

      return { fulfilled, rejected }
    },
    onSuccess: ({ fulfilled, rejected }) => {
      queryClient.invalidateQueries({ queryKey: [OWNERS_QUERY_KEY] })
      table.resetRowSelection()
      setDeleteDialogOpen(false)

      if (rejected === 0) {
        toastManager.add({
          type: 'success',
          title: 'Casas eliminadas',
          description: 'Las casas seleccionadas han sido eliminadas exitosamente.',
        })
      } else if (fulfilled === 0) {
        toastManager.add({
          type: 'error',
          title: 'Error',
          description: 'Ocurrió un error al eliminar las casas, intenta nuevamente.',
        })
      } else {
        toastManager.add({
          type: 'warning',
          title: 'Advertencia',
          description: `${fulfilled} eliminadas, ${rejected} fallaron.`,
        })
      }
    },
    onError: (error) => {
      console.error('Error deleting houses:', error)
      toastManager.add({
        type: 'error',
        title: 'Error',
        description: 'Ocurrió un error al eliminar las casas, intenta nuevamente.',
      })
    },
  })

  function handleBatchDelete() {
    batchDeleteMutation.mutate()
  }

  useEffect(() => {
    table.getColumn('houseNumber')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <>
      <CreateHouseSheet state={{ isOpen: openCreateOwnerDialog, onOpenChange: setOpenCreateOwnerDialog }} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar casas?</AlertDialogTitle>
            <AlertDialogDescription
              render={
                <div>
                  <p>
                    Casas seleccionadas: <strong>{selectedRowsLength}</strong>.
                  </p>
                  <p>Esta acción no se puede deshacer.</p>
                </div>
              }
            />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" disabled={batchDeleteMutation.isPending} />}>
              Cancelar
            </AlertDialogClose>
            <AlertDialogClose
              render={
                <Button
                  variant="destructive"
                  onClick={handleBatchDelete}
                  disabled={batchDeleteMutation.isPending}
                />
              }
            >
              Eliminar
              {batchDeleteMutation.isPending && <LoaderIcon />}
            </AlertDialogClose>
          </AlertDialogFooter>
        </AlertDialogPopup>
      </AlertDialog>

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <InputGroup className="w-full sm:w-sm">
          <InputGroupInput
            type="search"
            value={searchQuery}
            aria-label="Buscar"
            placeholder="Buscar"
            name="search-houses"
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
              <TooltipContent>Buscar por número de casa o propietario.</TooltipContent>
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
                    variant="destructive-outline"
                    aria-label="Borrar casas seleccionadas"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <IconTrash className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Eliminar seleccionados</TooltipContent>
            </Tooltip>
          )}

          {tableRowsLength > 0 && (
            <Button variant="outline">
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
