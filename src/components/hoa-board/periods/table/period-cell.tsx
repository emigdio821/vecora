import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { HoaBoardPeriodWithMembers } from '@/db/schemas/zod/hoa-board'
import { formatDate } from '@/lib/utils'
import { PeriodDetailsSheet } from '../sheets/period-details'

interface HoaPeriodCellProps {
  period: HoaBoardPeriodWithMembers
}

export function HoaPeriodCell({ period }: HoaPeriodCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <>
      <Button
        variant="plain"
        className="line-clamp-1 whitespace-normal text-left"
        onClick={() => setIsSheetOpen(true)}
      >
        {formatDate(period.startDate)}
      </Button>

      <PeriodDetailsSheet period={period} state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }} />
    </>
  )
}
