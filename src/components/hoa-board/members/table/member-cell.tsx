import { useState } from 'react'
import type { HoaBoardMemberQueryData } from '@/api/tanstack-queries/hoa-board'
import { Button } from '@/components/ui/button'
import { HoaMemberDetailsSheet } from '../sheets/member-details'

interface HoaMemberNameCellProps {
  member: HoaBoardMemberQueryData
}

export function HoaMemberNameCell({ member }: HoaMemberNameCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const { firstName, lastName } = member
  const fullName = `${firstName} ${lastName}`

  return (
    <>
      <Button
        variant="plain"
        className="line-clamp-2 whitespace-normal text-left"
        onClick={() => setIsSheetOpen(true)}
      >
        {fullName}
      </Button>

      <HoaMemberDetailsSheet member={member} state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }} />
    </>
  )
}
