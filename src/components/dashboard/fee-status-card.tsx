import { IconCalendarOff, IconCoins } from '@tabler/icons-react'
import { useQuery } from '@tanstack/react-query'
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
import { formatMonth } from '@/lib/utils'
import { m } from '@/paraglide/messages'
import { housesPickerQueryOptions } from '@/tanstack-queries/houses'
import { houseFeeStatusQueryOptions } from '@/tanstack-queries/treasury'

/** Header line: spell out the two extremes instead of "0 de 20" / "20 de 20". */
function feeStatusDescription(upToDate: number, total: number): string {
  if (total === 0) return m.dashboard_fees_current_period()
  if (upToDate === 0) return m.dashboard_fees_none_up_to_date()
  if (upToDate === total) return m.dashboard_fees_all_up_to_date()
  return m.dashboard_fees_some_up_to_date({ upToDate, total })
}

/**
 * Who is up to date with the monthly fee in the current period, and who is
 * not: every house missing at least one month so far, with the months owed.
 */
export function FeeStatusCard() {
  const status = useQuery(houseFeeStatusQueryOptions())
  // Owners come from the picker list, which is already cached by the forms.
  const houses = useQuery(housesPickerQueryOptions())

  if (status.isPending) {
    return <CardFrameSkeleton rows={3} />
  }

  if (status.isError) return null

  const total = status.data.length
  const pending = status.data.filter((h) => (h.unpaid_months?.length ?? 0) > 0)
  const upToDate = total - pending.length
  const ownersOf = (propertyId: string | null) =>
    houses.data
      ?.find((h) => h.id === propertyId)
      ?.owners.map(({ resident }) => `${resident.first_name} ${resident.last_name}`)
      .join(', ')

  return (
    <CardFrame className="w-full">
      <CardFrameHeader>
        <CardFrameTitle>{m.dashboard_fees_title()}</CardFrameTitle>
        <CardFrameDescription>{feeStatusDescription(upToDate, total)}</CardFrameDescription>
        <CardFrameAction className="text-muted-foreground">
          <IconCoins />
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel className="p-0">
          {total === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconCalendarOff />
                </EmptyMedia>
                <EmptyTitle>{m.dashboard_no_current_period()}</EmptyTitle>
                <EmptyDescription>{m.dashboard_fees_no_period_description()}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : pending.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <IconCoins />
                </EmptyMedia>
                <EmptyTitle>{m.dashboard_fees_all_up_to_date()}</EmptyTitle>
                <EmptyDescription>{m.dashboard_fees_nothing_owed()}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex max-h-56 flex-col divide-y overflow-y-auto">
              {pending.map((house) => {
                const months = house.unpaid_months ?? []
                const owners = ownersOf(house.property_id)
                return (
                  <li key={house.property_id} className="grid gap-1 px-6 py-3 text-sm first:pt-6 last:pb-6">
                    <div className="flex min-w-0 flex-col items-start gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <span className="max-w-full truncate">
                        <span className="font-medium">
                          {m.common_house_label({ number: house.number ?? '' })}
                        </span>
                        {owners && <span className="text-muted-foreground"> - {owners}</span>}
                      </span>
                      <Badge variant="warning" className="shrink-0">
                        {m.dashboard_fees_months_count({ count: months.length })}
                      </Badge>
                    </div>
                    {/* Plain text wraps; a badge per month pushed the house name off-screen. */}
                    <p className="text-xs text-muted-foreground">
                      {months.map((month) => formatMonth(month)).join(', ')}
                    </p>
                  </li>
                )
              })}
            </ul>
          )}
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
