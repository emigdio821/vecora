import { IconDotsVertical, IconEdit, IconInfoCircle, IconTrash } from '@tabler/icons-react'
import { useState } from 'react'
import { deleteNotification } from '@/api/server-functions/notifications'
import { AUDIT_LOGS_QUERY_KEY } from '@/api/tanstack-queries/audit-logs'
import { NOTIFICATIONS_QUERY_KEY } from '@/api/tanstack-queries/notifications'
import { AlertDialogGeneric } from '@/components/shared/alert-dialog-generic'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { SelectNotification } from '@/db/schemas/zod/notifications'
import { useEntityMutation } from '@/hooks/use-entity-mutation'
import type { DeleteNotificationData } from '@/schemas/notifications'
import { EditNotificationSheet } from '../sheets/edit-notification'
import { NotificationDetailsSheet } from '../sheets/notification-details'

interface ActionsProps {
  notification: SelectNotification
}

export function NotificationsTableActions({ notification }: ActionsProps) {
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isEditNotificationSheetOpen, setEditNotificationSheetOpen] = useState(false)
  const [isNotificationDetailsSheetOpen, setNotificationDetailsSheetOpen] = useState(false)

  const deleteNotificationMutation = useEntityMutation({
    mutationFn: async (data: DeleteNotificationData) => {
      return await deleteNotification({ data })
    },
    invalidateKeys: [NOTIFICATIONS_QUERY_KEY, AUDIT_LOGS_QUERY_KEY],
    successTitle: 'Notificación eliminada',
    successDescription: 'La notificación ha sido eliminada exitosamente.',
    errorDescription: 'Ocurrió un error al eliminar la notificación, intenta nuevamente.',
    onSuccess: () => {
      setDeleteDialogOpen(false)
    },
  })

  async function handleDeleteNotification() {
    await deleteNotificationMutation.mutateAsync({ notificationId: notification.id })
  }

  return (
    <>
      <AlertDialogGeneric
        state={{
          isOpen: isDeleteDialogOpen,
          onOpenChange: setDeleteDialogOpen,
        }}
        action={handleDeleteNotification}
        variant="destructive"
        actionLabel="Eliminar"
        title="¿Eliminar notificación?"
        description={
          <span>
            Estás por eliminar la notificación <strong>{notification.title}</strong>. Esta acción no se puede
            deshacer.
          </span>
        }
      />

      <NotificationDetailsSheet
        notification={notification}
        state={{ isOpen: isNotificationDetailsSheetOpen, onOpenChange: setNotificationDetailsSheetOpen }}
      />

      <EditNotificationSheet
        notification={notification}
        state={{ isOpen: isEditNotificationSheetOpen, onOpenChange: setEditNotificationSheetOpen }}
      />

      <div className="flex">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button aria-label="Table actions" size="icon" variant="ghost" className="ml-auto">
                <IconDotsVertical className="size-4" />
              </Button>
            }
          />
          <DropdownMenuContent align="end" className="max-w-42">
            <DropdownMenuGroup>
              <DropdownMenuLabel className="wrap-break-word my-1.5 line-clamp-2 py-0">
                {notification.title}
              </DropdownMenuLabel>

              <DropdownMenuItem onClick={() => setNotificationDetailsSheetOpen(true)}>
                <IconInfoCircle className="size-4" />
                Información
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setEditNotificationSheetOpen(true)}>
                <IconEdit className="size-4" />
                Editar
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem variant="destructive" onClick={() => setDeleteDialogOpen(true)}>
                <IconTrash className="size-4" />
                Eliminar
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </>
  )
}
