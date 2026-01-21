import { useState } from 'react'
import { Badge } from '@/components/ui/badge'
import type { HouseWithOwner } from '@/db/schemas/zod/houses'
import { HouseDetailsSheet } from '../sheets/house-details'

interface HouseNumberCellProps {
  house: HouseWithOwner
}

export function HouseNumberCell({ house }: HouseNumberCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <>
      <Badge
        size="lg"
        variant="outline"
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
