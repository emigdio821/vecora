import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { OwnerWithRelations } from '@/db/schemas/zod/owners'
import { OwnerDetailsSheet } from '../sheets/owner-details'

interface OwnerNameCellProps {
  owner: OwnerWithRelations
}

export function OwnerNameCell({ owner }: OwnerNameCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <>
      <Button
        variant="plain"
        className="line-clamp-2 whitespace-normal text-left"
        onClick={() => setIsSheetOpen(true)}
      >
        {`${owner.firstName} ${owner.lastName}`}
      </Button>
      <OwnerDetailsSheet owner={owner} state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }} />
    </>
  )
}
