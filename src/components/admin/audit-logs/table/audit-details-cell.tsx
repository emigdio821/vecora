import { useState } from 'react'
import { Button } from '@/components/ui/button'
import type { AuditLogWithUserAndProfile } from '@/db/schema/zod/audit-logs'
import { AuditLogDetailsSheet } from '../sheets/audit-log-details'

interface OwnerNameCellProps {
  auditLogs: AuditLogWithUserAndProfile
}

export function AuditDetailsCell({ auditLogs }: OwnerNameCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const userName = auditLogs.user?.name || auditLogs.userId || 'Desconocido'

  return (
    <>
      <Button
        variant="plain"
        className="line-clamp-2 whitespace-normal text-left"
        onClick={() => setIsSheetOpen(true)}
      >
        {userName}
      </Button>

      <AuditLogDetailsSheet
        auditLog={auditLogs}
        state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }}
      />
    </>
  )
}
