import { IconBell, IconCalendarOff, IconMessage } from '@tabler/icons-react'
import { CollapsibleDetails } from '@/components/shared/collapsible-details'
import { CopyButton } from '@/components/ui/copy-button'
import { FramePanel } from '@/components/ui/frame'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import type { SelectNotification } from '@/db/schemas/zod/notifications'
import { formatDate } from '@/lib/utils'

interface NotificationDetailsSheetProps {
  notification: SelectNotification
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function NotificationDetailsSheet({ notification, state }: NotificationDetailsSheetProps) {
  const { isOpen, onOpenChange } = state

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Información de la notificación</SheetTitle>
          <SheetDescription>Información completa y detallada de la notificación</SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-4">
          {/* Notification info */}
          <CollapsibleDetails
            title="Información de la notificación"
            icon={IconBell}
            content={
              <div className="space-y-1">
                <FramePanel className="flex items-center gap-2 p-2">
                  <div className="min-w-0 flex-1">
                    <h2 className="font-medium text-sm">Título</h2>
                    <p className="line-clamp-2 text-muted-foreground text-sm">{notification.title}</p>
                  </div>
                  <CopyButton tooltipText="Copiar ID" value={notification.id} />
                </FramePanel>
              </div>
            }
          />

          {/* Message info */}
          <CollapsibleDetails
            title="Mensaje"
            icon={IconMessage}
            content={
              <FramePanel className="p-2">
                <p className="whitespace-pre-wrap text-muted-foreground text-sm">{notification.message}</p>
              </FramePanel>
            }
          />

          {/* Expiration info */}
          {notification.expiresAt && (
            <CollapsibleDetails
              title="Expiración"
              icon={IconCalendarOff}
              content={
                <FramePanel className="p-2">
                  <h2 className="font-medium text-sm">Fecha de expiración</h2>
                  <p className="text-muted-foreground text-sm">{formatDate(notification.expiresAt)}</p>
                </FramePanel>
              }
            />
          )}
        </SheetPanel>

        <SheetFooter className="block space-y-1">
          {/* Metadata */}
          <div className="flex items-center justify-between text-muted-foreground text-xs">
            <span>Fecha de creación</span>
            <span>{formatDate(notification.createdAt)}</span>
          </div>
          {notification.updatedAt &&
            new Date(notification.updatedAt).getTime() > new Date(notification.createdAt).getTime() && (
              <div className="flex items-center justify-between text-muted-foreground text-xs">
                <span>Última actualización</span>
                <span>{formatDate(notification.updatedAt)}</span>
              </div>
            )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
