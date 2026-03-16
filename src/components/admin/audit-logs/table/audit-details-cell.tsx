import { useState } from 'react'
import type { AuditLogQueryData } from '@/api/tanstack-queries/audit-logs'
import { Button } from '@/components/ui/button'
import { AuditLogDetailsSheet } from '../sheets/audit-log-details'

interface OwnerNameCellProps {
  auditLog: AuditLogQueryData
}

export function AuditDetailsCell({ auditLog }: OwnerNameCellProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false)
  const userName = auditLog.user?.name || auditLog.userId || 'Desconocido'

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
        auditLog={auditLog}
        state={{ isOpen: isSheetOpen, onOpenChange: setIsSheetOpen }}
      />
    </>
  )
}
