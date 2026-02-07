import { Card, CardDescription, CardFrameFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetPanel,
  SheetTitle,
} from '@/components/ui/sheet'
import { formatDate } from '@/lib/utils'
import { RoleNameBadge } from '../role-name-badge'

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
    title: 'Reunión mensual',
    description: 'Recordatorio de la reunión mensual este viernes a las 6 PM.',
    date: new Date(),
    profile: {
      id: 456,
      name: 'María García',
      roles: ['president'],
    },
  },
  {
    id: 7,
    title: 'Mantenimiento de piscina',
    description: 'La piscina recibirá mantenimiento el próximo martes.',
    date: new Date(),
    profile: {
      id: 789,
      name: 'Carlos López',
      roles: ['maintainer'],
    },
  },
  {
    id: 8,
    title: 'Nuevo protocolo de seguridad',
    description: 'Se ha implementado un nuevo protocolo de acceso para visitantes.',
    date: new Date(),
    profile: {
      id: 101112,
      name: 'Ana Martínez',
      roles: ['security'],
    },
  },
]

interface AllNotificationsSheetProps {
  state: {
    isOpen: boolean
    onOpenChange: (open: boolean) => void
  }
}

export function AllNotificationsSheet({ state }: AllNotificationsSheetProps) {
  const { isOpen, onOpenChange } = state

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right">
        <SheetHeader>
          <SheetTitle>Todas las notificaciones</SheetTitle>
          <SheetDescription>{dummyNotifications.length} notificaciones en total</SheetDescription>
        </SheetHeader>

        <SheetPanel className="space-y-2">
          {dummyNotifications.map(({ date, description, id, profile, title }) => (
            <Card key={id} className="rounded-md">
              <CardHeader>
                <CardTitle className="text-sm">{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>

              <CardFrameFooter className="flex items-center justify-between text-muted-foreground text-xs">
                <div>
                  <p className="line-clamp-2 whitespace-normal">{profile.name}</p>
                  <p>{formatDate(date)}</p>
                </div>
                <RoleNameBadge roleName={profile.roles[0]} />
              </CardFrameFooter>
            </Card>
          ))}
        </SheetPanel>
      </SheetContent>
    </Sheet>
  )
}
