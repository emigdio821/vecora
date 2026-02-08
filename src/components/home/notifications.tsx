import { IconBell, IconBellOff, IconCalendarOff, IconCalendarWeek, IconUser } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { notificationsListQueryOptions } from '@/api/tanstack-queries/notifications'
import { TSQueryGenericError } from '@/components/shared/errors/query-generic'
import { TextGenericSkeleton } from '@/components/shared/skeletons/text-generic'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import type { NotificationWithRelations } from '@/db/schemas/zod/notifications'
import { formatDate } from '@/lib/utils'
import { AllNotificationsSheet } from '../shared/notifications/all-notifications-sheet'
import { RoleNameBadge } from '../shared/role-name-badge'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '../ui/empty'

export function HomeNotifications() {
  const [isAllNotificationsOpen, setAllNotificationsOpen] = useState(false)
  const {
    data: notifications = [],
    error,
    isLoading,
    refetch,
    isFetching,
  } = useQuery(notificationsListQueryOptions())

  const maxDisplayed = 3
  const hasMore = notifications.length > maxDisplayed
  const displayedNotifications = notifications.slice(0, maxDisplayed)
  const remainingNotifications = notifications.length - maxDisplayed
  const notifText = remainingNotifications === 1 ? 'notificación' : 'notificaciones'

  if (isLoading) {
    return <TextGenericSkeleton />
  }

  if (error) {
    return (
      <TSQueryGenericError
        refetch={refetch}
        errorDescription="Algo salió mal al cargar las notificaciones."
      />
    )
  }

  if (notifications.length === 0) {
    return (
      <Empty className="flex-0 border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconBellOff />
          </EmptyMedia>
          <EmptyTitle>Estás al día</EmptyTitle>
          <EmptyDescription>No hay notificaciones pendientes.</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button disabled={isLoading || isFetching} onClick={() => refetch()}>
            Recargar
          </Button>
        </EmptyContent>
      </Empty>
    )
  }

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
    <>
      <AllNotificationsSheet
        state={{
          isOpen: isAllNotificationsOpen,
          onOpenChange: setAllNotificationsOpen,
        }}
      />

      <div className="columns-1 gap-4 sm:columns-2 xl:columns-4">
        {displayedNotifications.map((notification) => (
          <Card key={notification.id} className="mb-4 break-inside-avoid">
            <CardHeader className="gap-0 py-2 pb-0">
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
        {hasMore && (
          <Card>
            <CardHeader className="gap-0 py-2 pb-0">
              <CardTitle className="text-sm">Notificaciones</CardTitle>
              <CardDescription>
                Hay {remainingNotifications} {notifText} más
              </CardDescription>
            </CardHeader>

            <CardFooter>
              <Button onClick={() => setAllNotificationsOpen(true)}>
                <IconBell />
                Ver todas
              </Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </>
  )
}
