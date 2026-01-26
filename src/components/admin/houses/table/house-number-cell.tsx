import { useState } from 'react'
import { HouseNumberBadge } from '@/components/shared/houses/house-number-badge'
import type { HouseWithOwner } from '@/db/schemas/zod/houses'
import { HouseDetailsSheet } from '../sheets/house-details'

interface HouseNumberCellProps {
  house: HouseWithOwner
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

      <HouseDetailsSheet house={house} state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }} />
    </>
  )
}
