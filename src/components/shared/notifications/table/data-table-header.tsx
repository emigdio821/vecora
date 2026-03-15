import { IconInfoCircle, IconPlus, IconSearch, IconTrash } from '@tabler/icons-react'
import type { Table } from '@tanstack/react-table'
import { parseAsString, useQueryState } from 'nuqs'
import { useEffect, useState } from 'react'
import { deleteNotification } from '@/api/server-functions/notifications'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { MY_NOTIFICATIONS_QUERY_KEY, NOTIFICATIONS_QUERY_KEY } from '@/api/tanstack-queries/notifications'
import { AlertDialogGeneric } from '@/components/shared/alert-dialog-generic'
import { Button } from '@/components/ui/button'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { SelectNotification } from '@/db/schema/zod/notifications'
import { useBulkDelete } from '@/hooks/use-bulk-delete'
import { CreateNotificationSheet } from '../sheets/create-notification'

interface NotificationsDataTableHeaderProps {
  table: Table<SelectNotification>
}

export function NotificationsDataTableHeader({ table }: NotificationsDataTableHeaderProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSearchTooltipOpen, setSearchTooltipOpen] = useState(false)
  const [isCreateNotificationSheetOpen, setCreateNotificationSheetOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useQueryState('search-notifications', parseAsString.withDefault(''))
  const tableRowsLength = table.getCoreRowModel().rows.length
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedRowsLength = selectedRows.length

  const bulkDeleteMutation = useBulkDelete({
    table,
    successTitle: 'Notificaciones eliminadas',
    successDescription: 'Las notificaciones seleccionadas han sido eliminadas exitosamente.',
    deleteFn: async (notification) => {
      await deleteNotification({ data: { notificationId: notification.id } })
    },
    invalidateKeys: [NOTIFICATIONS_QUERY_KEY, MY_NOTIFICATIONS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  async function handleBatchDelete() {
    await bulkDeleteMutation.mutateAsync()
  }

  useEffect(() => {
    table.getColumn('title')?.setFilterValue(searchQuery)
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
        title="¿Eliminar notificaciones?"
        description={
          <div>
            <p>
              Notificaciones seleccionadas: <strong>{selectedRowsLength}</strong>.
            </p>
            <p>Esta acción no se puede deshacer.</p>
          </div>
        }
      />

      <CreateNotificationSheet
        state={{
          isOpen: isCreateNotificationSheetOpen,
          onOpenChange: setCreateNotificationSheetOpen,
        }}
      />

      <div className="flex flex-col justify-between gap-2 sm:flex-row">
        <InputGroup className="w-full bg-background sm:w-sm">
          <InputGroupInput
            type="search"
            value={searchQuery}
            aria-label="Buscar"
            placeholder="Buscar"
            name="search-notifications"
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
              <TooltipContent>Buscar por título</TooltipContent>
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
                    aria-label="Eliminar notificaciones"
                    onClick={() => setDeleteDialogOpen(true)}
                  >
                    <IconTrash className="size-4" />
                  </Button>
                }
              />
              <TooltipContent>Eliminar seleccionadas</TooltipContent>
            </Tooltip>
          )}

          <Button onClick={() => setCreateNotificationSheetOpen(true)}>
            <IconPlus className="size-4" />
            Crear
          </Button>
        </div>
      </div>
    </>
  )
}
