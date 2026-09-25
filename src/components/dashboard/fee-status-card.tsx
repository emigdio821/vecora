'use client'

import { useQuery } from '@tanstack/react-query'
import { CalendarOffIcon, CoinsIcon } from 'lucide-react'
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
import { housesPickerQueryOptions } from '@/tanstack-queries/houses'
import { houseFeeStatusQueryOptions } from '@/tanstack-queries/treasury'

/**
 * Who is up to date with the monthly fee in the current period, and who is
 * not: every house missing at least one month so far, with the months owed.
 */
export function FeeStatusCard() {
  const status = useQuery(houseFeeStatusQueryOptions())
  // Owners come from the picker list, which is already cached by the forms.
  const houses = useQuery(housesPickerQueryOptions())

  if (status.isPending) {
    return <CardFrameSkeleton rows={2} />
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
        <CardFrameTitle>Cuotas de mantenimiento</CardFrameTitle>
        <CardFrameDescription>
          {total > 0 ? `${upToDate} de ${total} casas al corriente` : 'Periodo actual'}
        </CardFrameDescription>
        <CardFrameAction className="text-muted-foreground">
          <CoinsIcon />
        </CardFrameAction>
      </CardFrameHeader>
      <Card>
        <CardPanel className={pending.length ? 'px-0' : undefined}>
          {total === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CalendarOffIcon />
                </EmptyMedia>
                <EmptyTitle>Sin periodo actual</EmptyTitle>
                <EmptyDescription>Ningún periodo cubre la fecha de hoy.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : pending.length === 0 ? (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <CoinsIcon />
                </EmptyMedia>
                <EmptyTitle>Todas las casas están al corriente</EmptyTitle>
                <EmptyDescription>Ninguna casa debe cuotas de este periodo.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          ) : (
            <ul className="flex flex-col divide-y">
              {pending.map((house) => (
                <li
                  key={house.property_id}
                  className="flex items-center justify-between gap-4 px-6 py-3 text-sm first:pt-0 last:pb-0"
                >
                  <div className="grid min-w-0 gap-0.5">
                    <span className="font-medium">Casa {house.number}</span>
                    {ownersOf(house.property_id) && (
                      <span className="truncate text-xs text-muted-foreground">
                        {ownersOf(house.property_id)}
                      </span>
                    )}
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {(house.unpaid_months ?? []).map((month) => (
                      <Badge key={month} variant="warning">
                        {formatMonth(month)}
                      </Badge>
                    ))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardPanel>
      </Card>
    </CardFrame>
  )
}
