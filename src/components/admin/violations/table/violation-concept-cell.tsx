import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { ViolationWithOwner } from '@/db/schema/zod/violations'
import { ViolationDetailsSheet } from '../sheets/violation-details'

interface ViolationConceptCellProps {
  violation: ViolationWithOwner
}

export function ViolationConceptCell({ violation }: ViolationConceptCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <div>
      <Button
        variant="plain"
        className="line-clamp-2 whitespace-normal text-left"
        onClick={() => setIsSheetOpen(true)}
      >
        {violation.concept}
      </Button>

      <ViolationDetailsSheet
        violation={violation}
        state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }}
      />
    </div>
  )
}
