'use client'

import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'
import { CalendarDaysIcon, PartyPopperIcon } from 'lucide-react'
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
import { useToday } from '@/hooks/use-today'
import { ISO_DAY } from '@/lib/utils'
import { hallReservationsQueryOptions } from '@/tanstack-queries/presidency'

const MAX_NOTICES = 5

/**
 * What's coming up in the residential. For now that's only the terraza bookings;
 * announcements, if they ever land, join this same list.
 */
export function NoticesCard() {
  const reservations = useQuery(hallReservationsQueryOptions())
  const now = useToday()

  if (reservations.isPending) {
    return <CardFrameSkeleton rows={2} />
  }

  if (reservations.isError) return null

  const today = format(now, ISO_DAY)
  // The query is newest first; the notices read soonest first.
  const upcoming = reservations.data
    .filter((r) => r.reserved_on >= today)
    .sort((a, b) => a.reserved_on.localeCompare(b.reserved_on))
    .slice(0, MAX_NOTICES)

  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>Terraza</CardFrameTitle>
        <CardFrameDescription>Próximos eventos</CardFrameDescription>
        <CardFrameAction>
          <PartyPopperIcon className="text-muted-foreground" />
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel className="px-0">
          {upcoming.length ? (
            <ul className="flex flex-col divide-y">
              {upcoming.map((reservation) => (
                <li key={reservation.id} className="grid gap-0.5 px-6 py-3 text-sm first:pt-0 last:pb-0">
                  <span className="truncate font-medium">
                    {format(parseISO(reservation.reserved_on), "EEEE d 'de' MMMM", { locale: es })}
                    {reservation.reserved_on === today && ' - Hoy'}
                  </span>
                  <span className="truncate text-xs text-muted-foreground">
                    Casa {reservation.property.number}
                    {reservation.notes && ` - ${reservation.notes}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarDaysIcon />
                </EmptyMedia>
                <EmptyTitle>Sin eventos próximos</EmptyTitle>
                <EmptyDescription>Aquí aparecerán las reservaciones de la terraza.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
