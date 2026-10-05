import { IconReceipt } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { Link, type LinkOptions, linkOptions } from '@tanstack/react-router'
import { reservationStatus } from '@/components/presidency/reservations/status'
import { KIND_LABEL as SECURITY_KIND_LABEL } from '@/components/security/kind'
import { Money } from '@/components/shared/money'
import { CardFrameSkeleton } from '@/components/shared/skeletons/card-frame'
import {
  Card,
  CardFrame,
  CardFrameAction,
  CardFrameDescription,
  CardFrameHeader,
  CardFrameTitle,
  CardPanel,
} from '@/components/ui/card'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { type CurrencyCode, formatDay } from '@/lib/utils'
import { maintenanceRequestsQueryOptions } from '@/tanstack-queries/maintenance'
import { reservationsQueryOptions } from '@/tanstack-queries/presidency'
import { securityRequestsQueryOptions } from '@/tanstack-queries/security'

interface PaymentRequest {
  key: string
  link: LinkOptions
  section: string
  title: string
  amount: number
  currency: CurrencyCode
  requested_on: string
}

function pendingDescription(pending: number): string {
  if (pending === 0) return 'Sin solicitudes pendientes'
  return pending === 1 ? '1 solicitud pendiente' : `${pending} solicitudes pendientes`
}

/**
 * What the treasurer still has to pay or collect across Maintenance,
 * Security and Reservations, oldest first. Resolved ones live in each section.
 */
export function PaymentRequestsCard() {
  const maintenance = useQuery(maintenanceRequestsQueryOptions())
  const security = useQuery(securityRequestsQueryOptions())
  const reservations = useQuery(reservationsQueryOptions())

  if (maintenance.isPending || security.isPending || reservations.isPending) {
    return <CardFrameSkeleton rows={3} />
  }

  if (maintenance.isError || security.isError || reservations.isError) return null

  const pending: PaymentRequest[] = [
    ...maintenance.data
      .filter((r) => r.status === 'pending')
      .map((r) => ({
        key: `maintenance-${r.id}`,
        link: linkOptions({ to: '/maintenance' }),
        section: 'Mantenimiento',
        title: r.title,
        amount: r.amount,
        currency: r.currency,
        requested_on: r.requested_on,
      })),
    ...security.data
      .filter((r) => r.status === 'pending')
      .map((r) => ({
        key: `security-${r.id}`,
        link: linkOptions({ to: '/security' }),
        section: `Seguridad - ${SECURITY_KIND_LABEL[r.kind]}`,
        title: r.title,
        amount: r.amount,
        currency: r.currency,
        requested_on: r.requested_on,
      })),
    ...reservations.data
      .filter((r) => reservationStatus(r) === 'pending')
      .map((r) => ({
        key: `reservation-${r.id}`,
        link: linkOptions({ to: '/presidency', search: { tab: 'reservations' } }),
        section: 'Reservaciones',
        title: `Tarifa ${r.amenity.name} - Casa ${r.property.number}`,
        amount: Number(r.amount),
        currency: r.currency,
        requested_on: r.reserved_on,
      })),
  ].sort((a, b) => a.requested_on.localeCompare(b.requested_on))

  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>Solicitudes de pago</CardFrameTitle>
        <CardFrameDescription>{pendingDescription(pending.length)}</CardFrameDescription>
        <CardFrameAction className="text-muted-foreground">
          <IconReceipt />
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel className="p-0">
          {pending.length ? (
            <ul className="flex max-h-56 flex-col divide-y overflow-y-auto">
              {pending.map((request) => (
                <li key={request.key} className="grid gap-1 px-6 py-3 text-sm first:pt-6 last:pb-6">
                  <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="grid max-w-full min-w-0 gap-0.5">
                      <Link {...request.link} className="truncate font-medium hover:underline">
                        {request.title}
                      </Link>
                      <span className="truncate text-xs text-muted-foreground">
                        {request.section} - {formatDay(request.requested_on)}
                      </span>
                    </span>
                    <span className="shrink-0 font-medium tabular-nums">
                      <Money value={request.amount} currency={request.currency} />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconReceipt />
                </EmptyMedia>
                <EmptyTitle>Todo al día</EmptyTitle>
                <EmptyDescription>
                  Aquí aparecerán las solicitudes pendientes de "Mantenimiento", "Seguridad" y
                  "Reservaciones".
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
