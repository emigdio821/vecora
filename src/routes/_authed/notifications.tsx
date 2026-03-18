import { createFileRoute, redirect } from '@tanstack/react-router'
import { useState } from 'react'
import { CreateNotificationSheet } from '@/components/shared/notifications/sheets/create-notification'
import { NotificationsDataTable } from '@/components/shared/notifications/table/data-table'
import { hasRole } from '@/lib/auth/rbac'
import { createSEOTitle } from '@/lib/seo'
import { Role } from '@/types/rbac'

export const Route = createFileRoute('/_authed/notifications')({
  beforeLoad: async ({ context }) => {
    const profile = context.profile
    const role = profile?.user.role

    const isResident = hasRole(profile.user, [Role.RESIDENT])

    if (!role || isResident) {
      throw redirect({ to: '/' })
    }
  },
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
