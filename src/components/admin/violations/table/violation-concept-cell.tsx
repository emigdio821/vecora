import { useState } from 'react'
import type { ViolationQueryData } from '@/api/server-functions/violations'
import { Button } from '@/components/ui/button'
import { ViolationDetailsSheet } from '../sheets/violation-details'

interface ViolationConceptCellProps {
  violation: ViolationQueryData
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
