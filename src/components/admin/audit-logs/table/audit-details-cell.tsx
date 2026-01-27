import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { AuditLogWithUserAndProfile } from '@/db/schemas/zod/audit-logs'
import { AuditLogDetailsSheet } from '../sheets/audit-log-details'

interface OwnerNameCellProps {
  auditLogs: AuditLogWithUserAndProfile
}

export function AuditDetailsCell({ auditLogs }: OwnerNameCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const userName = auditLogs.user?.name || auditLogs.userId || 'Desconocido'

  return (
    <>
      <Button variant="plain" className="block truncate" onClick={() => setIsSheetOpen(true)}>
        {userName}
      </Button>

      <AuditLogDetailsSheet
        auditLog={auditLogs}
        state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }}
      />
    </>
  )
}
