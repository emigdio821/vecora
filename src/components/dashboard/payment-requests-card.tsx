'use client'

import { useQuery } from '@tanstack/react-query'
import { ReceiptTextIcon } from 'lucide-react'
import Link from 'next/link'
import { KIND_LABEL as SECURITY_KIND_LABEL } from '@/components/security/kind'
import { STATUS_BADGE_VARIANT, STATUS_LABEL } from '@/components/shared/request-status'
import { CardFrameSkeleton } from '@/components/shared/skeletons/card-frame'
import { Badge } from '@/components/ui/badge'
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
import { formatCurrency, formatDay } from '@/lib/utils'
import type { RequestStatus } from '@/lib/validations/requests'
import { maintenanceRequestsQueryOptions } from '@/tanstack-queries/maintenance'
import { securityRequestsQueryOptions } from '@/tanstack-queries/security'

const MAX_REQUESTS = 6

interface PaymentRequest {
  key: string
  href: '/maintenance' | '/security'
  area: string
  title: string
  amount: number
  requested_on: string
  status: RequestStatus
}

function pendingDescription(pending: number): string {
  if (pending === 0) return 'Sin solicitudes pendientes'
  return pending === 1 ? '1 solicitud pendiente' : `${pending} solicitudes pendientes`
}

/**
 * "Mantenimiento" and "Seguridad" payment requests in one list: the pending
 * ones first (they're what the treasurer has to act on), then the latest.
 */
export function PaymentRequestsCard() {
  const maintenance = useQuery(maintenanceRequestsQueryOptions())
  const security = useQuery(securityRequestsQueryOptions())

  if (maintenance.isPending || security.isPending) {
    return <CardFrameSkeleton rows={3} />
  }

  if (maintenance.isError || security.isError) return null

  const requests: PaymentRequest[] = [
    ...maintenance.data.map((r) => ({
      key: `maintenance-${r.id}`,
      href: '/maintenance' as const,
      area: 'Mantenimiento',
      title: r.title,
      amount: r.amount,
      requested_on: r.requested_on,
      status: r.status,
    })),
    ...security.data.map((r) => ({
      key: `security-${r.id}`,
      href: '/security' as const,
      area: `Seguridad - ${SECURITY_KIND_LABEL[r.kind]}`,
      title: r.title,
      amount: r.amount,
      requested_on: r.requested_on,
      status: r.status,
    })),
  ]
  const pending = requests
    .filter((r) => r.status === 'pending')
    .sort((a, b) => a.requested_on.localeCompare(b.requested_on))
  const resolved = requests
    .filter((r) => r.status !== 'pending')
    .sort((a, b) => b.requested_on.localeCompare(a.requested_on))
  const shown = [...pending, ...resolved].slice(0, MAX_REQUESTS)

  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>Solicitudes de pago</CardFrameTitle>
        <CardFrameDescription>{pendingDescription(pending.length)}</CardFrameDescription>
        <CardFrameAction className="text-muted-foreground">
          <ReceiptTextIcon />
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel className="p-0">
          {shown.length ? (
            <ul className="flex max-h-80 flex-col divide-y overflow-y-auto">
              {shown.map((request) => (
                <li key={request.key} className="grid gap-1 px-6 py-3 text-sm first:pt-6 last:pb-6">
                  <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="grid min-w-0 gap-0.5">
                      <Link href={request.href} className="truncate font-medium hover:underline">
                        {request.title}
                      </Link>
                      <span className="truncate text-xs text-muted-foreground">
                        {request.area} - {formatDay(request.requested_on)}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className="font-medium tabular-nums">{formatCurrency(request.amount)}</span>
                      <Badge variant={STATUS_BADGE_VARIANT[request.status]} size="sm">
                        {STATUS_LABEL[request.status]}
                      </Badge>
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <ReceiptTextIcon />
                </EmptyMedia>
                <EmptyTitle>Sin solicitudes</EmptyTitle>
                <EmptyDescription>
                  Aquí aparecerán las solicitudes de "Mantenimiento" y "Seguridad".
                </EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
