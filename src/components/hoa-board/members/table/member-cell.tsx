import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { HoaBoardMember } from '@/db/schemas/zod/hoa-board'
import { HoaMemberDetailsSheet } from '../sheets/member-details'

interface HoaMemberNameCellProps {
  member: HoaBoardMember
}

export function HoaMemberNameCell({ member }: HoaMemberNameCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { firstName, lastName } = member
  const fullName = `${firstName} ${lastName}`

  return (
    <>
      <Button
        variant="plain"
        className="line-clamp-1 whitespace-normal text-left"
        onClick={() => setIsSheetOpen(true)}
      >
        {fullName}
      </Button>

      <HoaMemberDetailsSheet member={member} state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }} />
    </>
  )
}
