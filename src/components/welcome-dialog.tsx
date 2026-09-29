'use client'

import { useMutation } from '@tanstack/react-query'
import {
  EyeIcon,
  GavelIcon,
  HeartHandshakeIcon,
  HistoryIcon,
  HouseIcon,
  type LucideIcon,
  MapPinHouseIcon,
  PiggyBankIcon,
  ReceiptTextIcon,
  SettingsIcon,
  SirenIcon,
  UserIcon,
  WrenchIcon,
} from 'lucide-react'
import Link from 'next/link'
import { parseAsBoolean, useQueryState } from 'nuqs'
import { useState } from 'react'
import { useCurrentUser } from '@/components/current-user-provider'
import { RoleNameBadge } from '@/components/shared/role-name-badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogPanel,
  DialogPopup,
  DialogTitle,
} from '@/components/ui/dialog'
import type { AppRole } from '@/lib/supabase/current-user'
import { markWelcomed } from '@/server-actions/profile'

/** `?welcome=true` reopens the dialog; the user menu sets it. */
export function useWelcomeParam() {
  return useQueryState('welcome', parseAsBoolean.withDefault(false))
}

interface Ability {
  icon: LucideIcon
  title: string
  description: string
  roles: AppRole[]
}

/** What each role can change. Admin gets every entry, like `private.has_role`. */
const ABILITIES: Ability[] = [
  {
    icon: MapPinHouseIcon,
    title: 'Residencial',
    description: 'Da de alta las casas y a sus residentes.',
    roles: ['president'],
  },
  {
    icon: GavelIcon,
    title: 'Presidencia',
    description: 'Abre los periodos de cuotas y aparta la terraza.',
    roles: ['president', 'treasurer'],
  },
  {
    icon: HeartHandshakeIcon,
    title: 'Mesa directiva',
    description: 'Agrega a los integrantes y compárteles su enlace de acceso.',
    roles: ['president'],
  },
  {
    icon: PiggyBankIcon,
    title: 'Tesorería',
    description: 'Registra los ingresos, egresos y cuotas pagadas, y sus categorías.',
    roles: ['treasurer'],
  },
  {
    icon: ReceiptTextIcon,
    title: 'Solicitudes de pago',
    description: 'Marca como pagadas o rechazadas las de "Mantenimiento" y "Seguridad".',
    roles: ['treasurer'],
  },
  {
    icon: WrenchIcon,
    title: 'Mantenimiento',
    description: 'Registra trabajos y compras. Cada uno le llega a "Tesorería" como solicitud de pago.',
    roles: ['maintenance'],
  },
  {
    icon: SirenIcon,
    title: 'Seguridad',
    description: 'Registra los gastos de seguridad. Cada uno le llega a "Tesorería" como solicitud de pago.',
    roles: ['security'],
  },
  {
    icon: HistoryIcon,
    title: 'Historial',
    description: 'Revisa cada cambio en la aplicación: qué se hizo, quién y cuándo.',
    roles: ['admin'],
  },
]

/**
 * A few pages about the app and what the user's roles let them do. Opens by
 * itself until it's closed once, then only from the user menu.
 */
export function WelcomeDialog() {
  const user = useCurrentUser()
  const [isRequested, setRequested] = useWelcomeParam()
  const [isFirstVisit, setFirstVisit] = useState(!user.welcomed)

  // Nothing to tell the user if it fails: the dialog just shows up once more.
  const mutation = useMutation({ mutationFn: markWelcomed })

  function markSeen() {
    if (isFirstVisit) {
      setFirstVisit(false)
      mutation.mutate()
    }
  }

  function close() {
    markSeen()
    void setRequested(null)
  }

  return (
    <Dialog
      open={isFirstVisit || isRequested}
      onOpenChange={(open) => {
        if (!open) close()
      }}
      // A stray click outside shouldn't skip it; the X and Escape still close it.
      disablePointerDismissal
    >
      <DialogPopup>
        {/* Mounted only while open, so it always starts from the first page. */}
        <WelcomeSteps onDone={close} onLeave={markSeen} />
      </DialogPopup>
    </Dialog>
  )
}

interface Step {
  title: string
  description: string
  content: React.ReactNode
}

/** `onLeave`: a link inside was followed; the new URL already drops `?welcome`. */
function WelcomeSteps({ onDone, onLeave }: { onDone: () => void; onLeave: () => void }) {
  const user = useCurrentUser()
  const [index, setIndex] = useState(0)

  const isAdmin = user.roles.includes('admin')
  const isManager = isAdmin || user.roles.includes('president')
  const abilities = ABILITIES.filter(
    (ability) => isAdmin || ability.roles.some((role) => user.roles.includes(role)),
  )

  const steps: Step[] = [
    {
      title: 'Te damos la bienvenida a Vecora',
      description: 'Aquí tienes una breve introducción de lo que puedes hacer en la aplicación.',
      content: (
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted-foreground">Entraste como</span>
          {user.roles.map((role) => (
            <RoleNameBadge key={role} roleName={role} />
          ))}
        </div>
      ),
    },
    {
      title: 'Lo que puedes hacer',
      description: 'Según tu rol, estas son las secciones donde puedes registrar y editar.',
      content: (
        <InfoList>
          {abilities.map((ability) => (
            <InfoRow key={ability.title} icon={ability.icon} title={ability.title}>
              {ability.description}
            </InfoRow>
          ))}
        </InfoList>
      ),
    },
    {
      title: 'Todo a la vista',
      description: 'Toda la mesa directiva trabaja con la misma información.',
      content: (
        <InfoList>
          <InfoRow icon={EyeIcon} title="Puedes consultar todo">
            Todas las secciones están abiertas para ti. Los botones para agregar o editar solo aparecen donde
            tienes permiso.
          </InfoRow>
          <InfoRow icon={HouseIcon} title="Inicio">
            El resumen del periodo, las cuotas pendientes, las solicitudes de pago y el reporte financiero en
            PDF.
          </InfoRow>
          <InfoRow icon={HistoryIcon} title="Cada cambio queda registrado">
            Todo lo que se crea, edita o elimina queda registrado en la aplicación con la información de quién
            lo hizo y cuándo.
          </InfoRow>
          <InfoRow icon={UserIcon} title="¿Tienes prisa?">
            Puedes ver la introducción cuando quieras, solo toca tu nombre en el menú lateral y elige "Ver
            introducción".
          </InfoRow>
        </InfoList>
      ),
    },
  ]

  if (isManager) {
    steps.push({
      title: 'Tu primer paso',
      description: 'Solo pueden entrar las personas que agregues a la mesa directiva.',
      content: (
        <div className="flex flex-col gap-4">
          <InfoList>
            <InfoRow icon={HeartHandshakeIcon} title="Invita a la mesa directiva">
              Agrega a cada integrante en "Mesa directiva" y compártele su enlace de acceso por WhatsApp o
              como prefieras. Con él crea su contraseña.
            </InfoRow>
            <InfoRow icon={SettingsIcon} title="Ajustes">
              Pon el nombre del residencial y su logo; se usan en el menú y en los reportes.
            </InfoRow>
          </InfoList>
          <Button
            className="self-start"
            variant="outline"
            render={<Link href="/hoa-board" />}
            onClick={onLeave}
          >
            <HeartHandshakeIcon />
            Ir a "Mesa directiva"
          </Button>
        </div>
      ),
    })
  }

  const step = steps[index]
  const isLast = index === steps.length - 1

  return (
    <>
      <DialogHeader>
        <DialogTitle>{step.title}</DialogTitle>
        <DialogDescription>{step.description}</DialogDescription>
      </DialogHeader>

      <DialogPanel>{step.content}</DialogPanel>

      <DialogFooter>
        <span className="self-center text-sm text-muted-foreground sm:me-auto">
          Paso {index + 1} de {steps.length}
        </span>
        {index > 0 && (
          <Button
            variant="ghost"
            onClick={() => {
              setIndex(index - 1)
            }}
          >
            Atrás
          </Button>
        )}
        {isLast ? (
          <Button onClick={onDone}>Empezar</Button>
        ) : (
          <Button
            onClick={() => {
              setIndex(index + 1)
            }}
          >
            Siguiente
          </Button>
        )}
      </DialogFooter>
    </>
  )
}

function InfoList({ children }: { children: React.ReactNode }) {
  return <ul className="flex flex-col gap-4">{children}</ul>
}

function InfoRow({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon
  title: string
  children: React.ReactNode
}) {
  return (
    <li className="flex gap-3">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5 text-sm">
        <span className="font-medium">{title}</span>
        <span className="text-muted-foreground">{children}</span>
      </div>
    </li>
  )
}
