import { IconFileExport, IconInfoCircle, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Table } from '@tanstack/react-table'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { deleteOwner } from '@/api/server-functions/owners'
import { OWNERS_QUERY_KEY } from '@/api/tanstack-queries/owners'
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
import type { OwnerWithRelations } from '@/db/schemas/zod/owners'
import { CreateOwnerSheet } from '../sheets/create-owner'

interface OwnersDataTableHeaderProps {
  table: Table<OwnerWithRelations>
}

export function OwnersDataTableHeader({ table }: OwnersDataTableHeaderProps) {
  const [openCreateOwnerDialog, setOpenCreateOwnerDialog] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-owners', parseAsString.withDefault(''))
  const queryClient = useQueryClient()
  const tableRowsLength = table.getCoreRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length
  const selectedOwners = selectedRows.map((row) => row.original)

  const batchDeleteMutation = useMutation({
    mutationFn: async () => {
      const results = await Promise.allSettled(
        selectedOwners.map((owner) => deleteOwner({ data: { ownerId: owner.id } })),
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
          title: 'Propietarios eliminados',
          description: 'Los propietarios seleccionados han sido eliminados exitosamente.',
        })
      } else if (fulfilled === 0) {
        toastManager.add({
          type: 'error',
          title: 'Error',
          description: 'Ocurrió un error al eliminar los propietarios, intenta nuevamente.',
        })
      } else {
        toastManager.add({
          type: 'warning',
          title: 'Advertencia',
          description: `${fulfilled} eliminados, ${rejected} fallaron.`,
        })
      }
    },
    onError: (error) => {
      console.error('Error deleting owners:', error)
      toastManager.add({
        type: 'error',
        title: 'Error',
        description: 'Ocurrió un error al eliminar los propietarios, intenta nuevamente.',
      })
    },
  })

  function handleBatchDelete() {
    batchDeleteMutation.mutate()
  }

  useEffect(() => {
    table.getColumn('firstName')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <>
      <CreateOwnerSheet state={{ isOpen: openCreateOwnerDialog, onOpenChange: setOpenCreateOwnerDialog }} />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar propietarios?</AlertDialogTitle>
            <AlertDialogDescription
              render={
                <div>
                  <p>
                    Propietarios seleccionados: <strong>{selectedRowsLength}</strong>.
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
            name="search-owners"
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
              <TooltipContent>Buscar por nombre</TooltipContent>
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
                    aria-label="Borrar propietario"
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
