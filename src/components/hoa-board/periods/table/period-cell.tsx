import { useState } from 'react'
import type { HoaBoardPeriodQueryData } from '@/api/tanstack-queries/hoa-board'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { HoaPeriodDetailsSheet } from '../sheets/period-details'

interface HoaPeriodCellProps {
  period: HoaBoardPeriodQueryData
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

      <HoaPeriodDetailsSheet period={period} state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }} />
    </>
  )
}
