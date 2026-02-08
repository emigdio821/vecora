import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CreateNotificationSheet } from '@/components/shared/notifications/sheets/create-notification'
import { Button } from '@/components/ui/button'

export const Route = createFileRoute('/_authed/notifications')({
  component: RouteComponent,
})

function RouteComponent() {
  const [isCreateNotificationSheetOpen, setCreateNotificationSheetOpen] = useState(false)

  return (
    <>
      <CreateNotificationSheet
        state={{
          isOpen: isCreateNotificationSheetOpen,
          onOpenChange: setCreateNotificationSheetOpen,
        }}
      />

      <div className="flex flex-col gap-2">
        <h1 className="font-heading font-medium text-lg leading-none">Notificaciones</h1>
        <p className="text-muted-foreground text-sm">
          En esta sección puedes administrar tus notificaciones.
        </p>

        <div>
          <Button onClick={() => setCreateNotificationSheetOpen(true)}>Crear notificación</Button>
        </div>
      </div>
    </>
  )
}
