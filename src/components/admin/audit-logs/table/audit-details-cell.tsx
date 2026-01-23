import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { AuditLogWithUser } from '@/db/schemas/zod/audit-logs'
import { AuditDetailsSheet } from '../sheets/audit-details'

interface OwnerNameCellProps {
  auditLogs: AuditLogWithUser
}

export function AuditDetailsCell({ auditLogs }: OwnerNameCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const userName = auditLogs.user?.name || auditLogs.userId || 'Desconocido'

  return (
    <>
      <Button variant="link" className="block truncate" onClick={() => setIsSheetOpen(true)}>
        {userName}
      </Button>
      <AuditDetailsSheet auditLog={auditLogs} state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }} />
    </>
  )
}
