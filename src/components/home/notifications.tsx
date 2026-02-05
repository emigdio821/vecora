import { IconBell, IconBellOff } from '@tabler/icons-react'
import { useState } from 'react'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import { AllNotificationsSheet } from '../shared/notifications/all-notifications-sheet'
import { RoleNameBadge } from '../shared/role-name-badge'
import { Button } from '../ui/button'
import { Empty, EmptyContent, EmptyHeader, EmptyMedia, EmptyTitle } from '../ui/empty'

const dummyNotifications = [
  {
    id: 1,
    title: 'Pago al jardinero',
    description: 'Se le pagó al jardinero todo el mes de junio.',
    date: new Date(),
    profile: {
      id: 123,
      name: 'Juan Pérez',
      roles: ['maintainer'],
    },
  },
  {
    id: 2,
    title: 'Cámara de seguridad rota',
    description: 'La cámara de seguridad en la entrada principal está rota y necesita reparación.',
    date: new Date(),
    profile: {
      id: 321,
      name: 'John Doe',
      roles: ['security'],
    },
  },
  {
    id: 3,
    title: 'Junta de emergencia',
    description:
      'Se convoca a una junta de emergencia para discutir el aumento de las cuotas de mantenimiento.',
    date: new Date(),
    profile: {
      id: 321,
      name: 'Frida Kahlo',
      roles: ['president'],
    },
  },
  {
    id: 4,
    title: 'Aviso de mantenimiento',
    description: 'El sistema estará en mantenimiento el próximo lunes de 10 PM a 2 AM.',
    date: new Date(),
    profile: {
      id: 3211,
      name: 'Emigdio Torres',
      roles: ['admin'],
    },
  },
  {
    id: 5,
    title: 'Dinero de Febrero',
    description: 'Se ha registrado el dinero correspondiente a febrero sin incidencias.',
    date: new Date(),
    profile: {
      id: 3211123,
      name: 'Miguel Hidalgo y Costilla',
      roles: ['treasurer'],
    },
  },
  {
    id: 6,
    title: 'Dinero de Febrero',
    description: 'Se ha registrado el dinero correspondiente a febrero sin incidencias.',
    date: new Date(),
    profile: {
      id: 3211123,
      name: 'Miguel Hidalgo y Costilla',
      roles: ['treasurer'],
    },
  },
  {
    id: 7,
    title: 'Dinero de Febrero',
    description: 'Se ha registrado el dinero correspondiente a febrero sin incidencias.',
    date: new Date(),
    profile: {
      id: 3211123,
      name: 'Miguel Hidalgo y Costilla',
      roles: ['treasurer'],
    },
  },
  {
    id: 8,
    title: 'Dinero de Febrero',
    description: 'Se ha registrado el dinero correspondiente a febrero sin incidencias.',
    date: new Date(),
    profile: {
      id: 3211123,
      name: 'Miguel Hidalgo y Costilla',
      roles: ['treasurer'],
    },
  },
]

export function HomeNotifications() {
  const [isAllNotificationsOpen, setAllNotificationsOpen] = useState(false)
  const notifications = dummyNotifications
  const maxDisplayed = 3
  const hasMore = notifications.length > maxDisplayed
  const displayedNotifications = notifications.slice(0, maxDisplayed)

  if (notifications.length === 0) {
    return (
      <Empty className="flex-0 border border-dashed">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <IconBellOff />
          </EmptyMedia>
          <EmptyTitle>Aún no hay notificaciones</EmptyTitle>
        </EmptyHeader>
        <EmptyContent>
          <Button onClick={() => {}}>Recargar</Button>
        </EmptyContent>
      </Empty>
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
        {displayedNotifications.map(({ date, description, id, profile, title }) => (
          <Card key={id} className="mb-4">
            <CardHeader>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </CardHeader>
            <CardFooter className="flex items-center justify-between text-muted-foreground text-xs">
              <div>
                <p className="truncate">{profile.name}</p>
                <p>{formatDate(date)}</p>
              </div>
              <RoleNameBadge roleName={profile.roles[0]} />
            </CardFooter>
          </Card>
        ))}
        {hasMore && (
          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
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
