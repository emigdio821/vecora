import { IconCalendarOff, IconCalendarWeek, IconUser } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { notificationsListQueryOptions } from '@/api/tanstack-queries/notifications'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import type { NotificationWithRelations } from '@/db/schemas/zod/notifications'
import { formatDate } from '@/lib/utils'
import { RoleNameBadge } from '../role-name-badge'

interface AllNotificationsSheetProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function AllNotificationsSheet({ state }: AllNotificationsSheetProps) {
  const { isOpen, onOpenChange } = state
  const { data: notifications = [] } = useQuery(notificationsListQueryOptions())

  function getProfileName(notification: NotificationWithRelations) {
    const profile = notification.profile
    return profile?.user?.name ?? 'Sistema'
  }

  function renderRoles(notification: NotificationWithRelations) {
    const profile = notification.profile

    if (!profile) return <Badge variant="outline">Administración</Badge>

    return (
      <div className="flex flex-wrap gap-1">
        {profile?.profileRoles.map(({ role }) => (
          <RoleNameBadge className="text-xs" key={role.id} roleName={role.name} />
        ))}
      </div>
    )
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Todas las notificaciones</SheetTitle>
          <SheetDescription>{notifications.length} notificaciones en total</SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-2">
          {notifications.map((notification) => (
            <Card key={notification.id} className="rounded-md">
              <CardHeader>
                <CardTitle className="text-sm">{notification.title}</CardTitle>
                <CardDescription>{notification.message}</CardDescription>
              </CardHeader>

              <CardFooter className="flex items-center justify-between text-muted-foreground text-xs">
                <div>
                  <p className="flex items-center gap-1">
                    <IconUser className="size-4" />
                    <span className="line-clamp-2 flex-1">{getProfileName(notification)}</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <IconCalendarWeek className="size-4" />
                    {formatDate(notification.createdAt)}
                  </p>
                  {notification.expiresAt && (
                    <p className="flex items-center gap-1">
                      <IconCalendarOff className="size-4" />
                      {formatDate(notification.expiresAt)}
                    </p>
                  )}
                </div>
                {renderRoles(notification)}
              </CardFooter>
            </Card>
          ))}
        </SheetPanel>
      </SheetContent>
    </Sheet>
  )
}
