import { Button } from '@/components/ui/button'
import { SheetCreateHandle, SheetTrigger } from '@/components/ui/sheet'
import type { AuditLogWithUserAndProfile } from '@/db/schemas/zod/audit-logs'
import { AuditLogDetailsSheet } from '../sheets/audit-log-details'

interface OwnerNameCellProps {
  auditLogs: AuditLogWithUserAndProfile
}

const auditDetailsSheetHandle = SheetCreateHandle()

export function AuditDetailsCell({ auditLogs }: OwnerNameCellProps) {
  const userName = auditLogs.user?.name || auditLogs.userId || 'Desconocido'

  return (
    <>
      <SheetTrigger
        handle={auditDetailsSheetHandle}
        render={
          <Button variant="plain" className="block truncate">
            {userName}
          </Button>
        }
      />

      <AuditLogDetailsSheet auditLog={auditLogs} handle={auditDetailsSheetHandle} />
    </>
  )
}
