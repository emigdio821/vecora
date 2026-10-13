import { IconReceipt } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { Link, type LinkOptions, linkOptions } from '@tanstack/react-router'
import { reservationStatus } from '@/components/presidency/reservations/status'
import { KIND_LABEL as SECURITY_KIND_LABEL } from '@/components/security/kind'
import { Money } from '@/components/shared/money'
import {
  CARD_LIST_CLASS,
  CARD_LIST_EMPTY_CLASS,
  CARD_LIST_PANEL_CLASS,
  CARD_LIST_ROW_CLASS,
  CardListSkeleton,
} from '@/components/shared/skeletons/card-list'
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
import { Skeleton } from '@/components/ui/skeleton'
import { type CurrencyCode, cn, formatDay } from '@/lib/utils'
import { m } from '@/paraglide/messages'
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

// On phones the amount goes below the title, so a row is 100px: two are 201px with the divider.
const PANEL_CLASS = cn(CARD_LIST_PANEL_CLASS, 'h-50.25 sm:h-38.25')

/** A row's lines: title and section, and the amount (beside them, or below on phones). */
function PaymentRequestsSkeleton() {
  return (
    <CardListSkeleton
      rows={2}
      panelClassName={PANEL_CLASS}
      row={
        <div className="flex flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid w-1/2 gap-1">
            <div className="flex h-5 items-center">
              <Skeleton className="h-3.5 w-full" />
            </div>
            <div className="flex h-4 items-center">
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
          <div className="flex h-5 items-center">
            <Skeleton className="h-3.5 w-20" />
          </div>
        </div>
      }
    />
  )
}

function pendingDescription(pending: number): string {
  if (pending === 0) return m.dashboard_requests_none_pending()
  return m.dashboard_requests_pending_count({ count: pending })
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
    return <PaymentRequestsSkeleton />
  }

  if (maintenance.isError || security.isError || reservations.isError) return null

  const pending: PaymentRequest[] = [
    ...maintenance.data
      .filter((r) => r.status === 'pending')
      .map((r) => ({
        key: `maintenance-${r.id}`,
        link: linkOptions({ to: '/maintenance', search: { 'search-requests': r.title } }),
        section: m.common_section_maintenance(),
        title: r.title,
        amount: r.amount,
        currency: r.currency,
        requested_on: r.requested_on,
      })),
    ...security.data
      .filter((r) => r.status === 'pending')
      .map((r) => ({
        key: `security-${r.id}`,
        link: linkOptions({ to: '/security', search: { 'search-requests': r.title } }),
        section: `${m.common_section_security()} - ${SECURITY_KIND_LABEL[r.kind]}`,
        title: r.title,
        amount: r.amount,
        currency: r.currency,
        requested_on: r.requested_on,
      })),
    ...reservations.data
      .filter((r) => reservationStatus(r) === 'pending')
      .map((r) => ({
        key: `reservation-${r.id}`,
        // The reservations search only matches the house, so the area filter narrows it to the amenity.
        link: linkOptions({
          to: '/presidency',
          search: {
            tab: 'reservations',
            'search-reservations': m.common_house_label({ number: r.property.number }),
            area: r.amenity.id,
          },
        }),
        section: m.common_section_reservations(),
        title: m.dashboard_requests_reservation_fee({ amenity: r.amenity.name, number: r.property.number }),
        amount: Number(r.amount),
        currency: r.currency,
        requested_on: r.reserved_on,
      })),
  ].sort((a, b) => a.requested_on.localeCompare(b.requested_on))

  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>{m.dashboard_requests_title()}</CardFrameTitle>
        <CardFrameDescription>{pendingDescription(pending.length)}</CardFrameDescription>
        <CardFrameAction className="text-muted-foreground">
          <IconReceipt />
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel className={PANEL_CLASS}>
          {pending.length ? (
            <ul className={CARD_LIST_CLASS}>
              {pending.map((request) => (
                <li key={request.key} className={cn(CARD_LIST_ROW_CLASS, 'text-sm')}>
                  <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <span className="grid max-w-full min-w-0 gap-1">
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
            <Empty className={CARD_LIST_EMPTY_CLASS}>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconReceipt />
                </EmptyMedia>
                <EmptyTitle>{m.dashboard_requests_empty_title()}</EmptyTitle>
                <EmptyDescription>{m.dashboard_requests_empty_description()}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
