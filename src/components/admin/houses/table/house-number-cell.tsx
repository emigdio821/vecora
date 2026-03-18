import { useState } from 'react'
import type { HouseQueryData } from '@/api/tanstack-queries/houses'
import { HouseNumberBadge } from '@/components/shared/houses/house-number-badge'
import { HouseDetailsSheet } from '../sheets/house-details'

interface HouseNumberCellProps {
  house: HouseQueryData
}

export function HouseNumberCell({ house }: HouseNumberCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <>
      <HouseNumberBadge
        number={house.houseNumber}
        render={
          <button type="button" onClick={() => setIsSheetOpen(true)}>
            {house.houseNumber}
          </button>
        }
      />

      <HouseDetailsSheet house={house} open={isSheetOpen} onOpenChange={setIsSheetOpen} />
    </>
  )
}
