import { useState } from 'react'
import type { ResidentQueryData } from '@/api/tanstack-queries/residents'
import { Button } from '@/components/ui/button'
import { ResidentDetailsSheet } from '../sheets/resident-details'

interface ResidentNameCellProps {
  resident: ResidentQueryData
}

export function ResidentNameCell({ resident }: ResidentNameCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const fullName = `${resident.firstName} ${resident.lastName}`

  return (
    <div>
      <Button
        variant="plain"
        className="line-clamp-2 whitespace-normal text-left"
        onClick={() => setIsSheetOpen(true)}
      >
        {fullName}
      </Button>

      <ResidentDetailsSheet
        resident={resident}
        state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }}
      />
    </div>
  )
}
