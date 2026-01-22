import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { SelectExternalUser } from '@/db/schemas/zod/external-users'
import { ExternalUserDetailsSheet } from '../sheets/external-user-details'

interface ExternalUserNameCellProps {
  externalUser: SelectExternalUser
}

export function ExternalUserNameCell({ externalUser }: ExternalUserNameCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <>
      <Button variant="link" className="block truncate" onClick={() => setIsSheetOpen(true)}>
        {`${externalUser.firstName} ${externalUser.lastName}`}
      </Button>
      <ExternalUserDetailsSheet
        externalUser={externalUser}
        state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }}
      />
    </>
  )
}
