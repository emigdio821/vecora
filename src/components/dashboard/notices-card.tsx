import { IconCalendarMonth, IconConfetti } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { format, parseISO } from 'date-fns'
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
import { useToday } from '@/hooks/use-today'
import { cn, dateLocale, ISO_DAY } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import { reservationsQueryOptions } from '@/tanstack-queries/presidency'

const MAX_NOTICES = 5

/** A row's lines: the day, then the area, house and notes. */
function NoticesSkeleton() {
  return (
    <CardListSkeleton
      rows={2}
      row={
        <>
          <div className="flex h-5 items-center">
            <Skeleton className="h-3.5 w-2/5" />
          </div>
          <div className="flex h-4 items-center">
            <Skeleton className="h-3 w-3/5" />
          </div>
        </>
      }
    />
  )
}

/**
 * What's coming up in the residential. For now that's only the common area
 * bookings; announcements, if they ever land, join this same list.
 */
export function NoticesCard() {
  const reservations = useQuery(reservationsQueryOptions)
  const now = useToday()

  if (reservations.isPending) {
    return <NoticesSkeleton />
  }

  if (reservations.isError) return null

  const today = format(now, ISO_DAY)
  // The query is newest first; the notices read soonest first. A cancelled
  // booking no longer happens.
  const upcoming = reservations.data
    .filter((r) => r.reserved_on >= today && !r.cancelled_at)
    .sort((a, b) => a.reserved_on.localeCompare(b.reserved_on))
    .slice(0, MAX_NOTICES)

  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>{m.common_section_reservations()}</CardFrameTitle>
        <CardFrameDescription>{m.dashboard_notices_upcoming()}</CardFrameDescription>
        <CardFrameAction>
          <IconConfetti className="text-muted-foreground" />
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel className={CARD_LIST_PANEL_CLASS}>
          {upcoming.length ? (
            <ul className={CARD_LIST_CLASS}>
              {upcoming.map((reservation) => (
                <li key={reservation.id} className={cn(CARD_LIST_ROW_CLASS, 'text-sm')}>
                  {/* The search only matches the house; the area filter narrows it to the amenity. */}
                  <Link
                    to="/presidency"
                    search={{
                      tab: 'reservations',
                      'search-reservations': m.common_house_label({ number: reservation.property.number }),
                      area: reservation.amenity.id,
                    }}
                    className="max-w-full justify-self-start truncate font-medium hover:underline"
                  >
                    {format(parseISO(reservation.reserved_on), m.dashboard_notices_date_pattern(), {
                      locale: dateLocale(),
                    })}
                    {reservation.reserved_on === today && ` - ${m.common_today()}`}
                  </Link>
                  <span className="truncate text-xs text-muted-foreground">
                    {reservation.amenity.name} -{' '}
                    {m.common_house_label({ number: reservation.property.number })}
                    {reservation.notes && ` - ${reservation.notes}`}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <Empty className={CARD_LIST_EMPTY_CLASS}>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconCalendarMonth />
                </EmptyMedia>
                <EmptyTitle>{m.dashboard_notices_empty_title()}</EmptyTitle>
                <EmptyDescription>{m.dashboard_notices_empty_description()}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
