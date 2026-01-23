import { IconFileExport, IconInfoCircle, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { deleteExternalUser } from '@/api/server-functions/external-users'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { EXTERNAL_USERS_QUERY_KEY } from '@/api/tanstack-queries/external-users'
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SelectExternalUser } from '@/db/schemas/zod/external-users'
import { useBulkDelete } from '@/hooks/use-bulk-delete'
import { CreateExternalUserSheet } from '../sheets/create-external-user'

interface ExternalUsersDataTableHeaderProps {
  table: Table<SelectExternalUser>
}

export function ExternalUsersDataTableHeader({ table }: ExternalUsersDataTableHeaderProps) {
  const [openCreateExternalUserDialog, setOpenCreateExternalUserDialog] = useState(false)
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-external-users', parseAsString.withDefault(''))
  const tableRowsLength = table.getCoreRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length

  const bulkDeleteMutation = useBulkDelete({
    table,
    successTitle: 'Usuarios externos eliminados',
    successDescription: 'Los usuarios externos seleccionados han sido eliminados exitosamente.',
    deleteFn: async (externalUser) => {
      await deleteExternalUser({ data: { externalUserId: externalUser.id } })
    },
    invalidateKeys: [EXTERNAL_USERS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  function handleBatchDelete() {
    bulkDeleteMutation.mutate()
  }

  useEffect(() => {
    table.getColumn('firstName')?.setFilterValue(searchQuery)
  }, [searchQuery, table])

  return (
    <>
      <CreateExternalUserSheet
        state={{ isOpen: openCreateExternalUserDialog, onOpenChange: setOpenCreateExternalUserDialog }}
      />

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogPopup>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar usuarios externos?</AlertDialogTitle>
            <AlertDialogDescription
              render={
                <div>
                  <p>
                    Usuarios externos seleccionados: <strong>{selectedRowsLength}</strong>.
                  </p>
                  <p>Esta acción no se puede deshacer.</p>
                </div>
              }
            />
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogClose render={<Button variant="outline" disabled={bulkDeleteMutation.isPending} />}>
              Cancelar
            </AlertDialogClose>
            <AlertDialogClose
              render={
                <Button
                  variant="destructive"
                  onClick={handleBatchDelete}
                  disabled={bulkDeleteMutation.isPending}
                />
              }
            >
              Eliminar
              {bulkDeleteMutation.isPending && <LoaderIcon />}
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
            name="search-external-users"
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
                    aria-label="Borrar usuario externo"
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

          <Button onClick={() => setOpenCreateExternalUserDialog(true)}>
            <IconPlus className="size-4" />
            Crear
          </Button>
        </div>
      </div>
    </>
  )
}
