import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { CreateNotificationSheet } from '@/components/shared/notifications/sheets/create-notification'
import { NotificationsDataTable } from '@/components/shared/notifications/table/data-table'
import { createSEOTitle } from '@/lib/seo'

export const Route = createFileRoute('/_authed/notifications')({
  component: RouteComponent,
  head: () => ({
    meta: [{ title: createSEOTitle('Notificaciones') }],
  }),
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

      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-heading font-medium text-lg leading-none">Notificaciones</h1>
          <p className="text-muted-foreground text-sm">
            En esta sección puedes administrar tus notificaciones.
          </p>
        </div>

        <NotificationsDataTable />
      </div>
    </>
  )
}
