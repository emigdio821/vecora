'use client'

import { IconFileExport, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { Table } from '@tanstack/react-table'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { LoaderIcon } from '@/components/icons'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { OwnerWithRelations } from '@/db/schemas/zod'
import { OWNERS_QUERY_KEY } from '@/lib/ts-queries/owners'
import { deleteOwner } from '@/server-fns/owners'
import { CreateOwnerSheet } from '../sheets/owner/create'

interface OwnersDataTableHeaderProps {
  table: Table<OwnerWithRelations>
}

export function OwnersDataTableHeader({ table }: OwnersDataTableHeaderProps) {
  const [openCreateOwnerDialog, setOpenCreateOwnerDialog] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search', parseAsString.withDefault(''))
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
      setIsDeleteDialogOpen(false)

      if (rejected === 0) {
        toast.success('Propietarios seleccionados fueron eliminados exitosamente.')
      } else if (fulfilled === 0) {
        toast.error('Ocurrió un error al eliminar los propietarios, intenta nuevamente.')
      } else {
        toast.warning(`${fulfilled} eliminados, ${rejected} fallaron.`)
      }
    },
    onError: () => {
      toast.error('Ocurrió un error al eliminar los propietarios, intenta nuevamente.')
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

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia>
              <IconTrash className="text-destructive" />
            </AlertDialogMedia>
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
            <AlertDialogCancel disabled={batchDeleteMutation.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={handleBatchDelete}
              disabled={batchDeleteMutation.isPending}
            >
              Eliminar
              {batchDeleteMutation.isPending && <LoaderIcon />}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <InputGroup className="w-full sm:w-sm">
          <InputGroupAddon align="inline-start">
            <IconSearch className="size-4" />
          </InputGroupAddon>

          <InputGroupInput
            name="search-owner"
            value={searchQuery}
            placeholder="Buscar propietarios..."
            onChange={(e) => setSearchQuery(e.target.value || null)}
          />
        </InputGroup>

        <div className="flex gap-2">
          {selectedRowsLength > 0 && (
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    size="icon"
                    variant="destructive"
                    aria-label="Borrar propietario"
                    onClick={() => setIsDeleteDialogOpen(true)}
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
            Nuevo
          </Button>
        </div>
      </div>
    </>
  )
}
