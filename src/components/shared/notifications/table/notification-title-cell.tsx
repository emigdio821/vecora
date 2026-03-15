import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { SelectNotification } from '@/db/schema/zod/notifications'
import { NotificationDetailsSheet } from '../sheets/notification-details'

interface NotificationTitleCellProps {
  notification: SelectNotification
}

export function NotificationTitleCell({ notification }: NotificationTitleCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)

  return (
    <>
      <Button variant="plain" className="block truncate text-left" onClick={() => setIsSheetOpen(true)}>
        {notification.title}
      </Button>
      <NotificationDetailsSheet
        notification={notification}
        state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }}
      />
    </>
  )
}
