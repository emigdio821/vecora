import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { AuditLogAction } from '@/db/schema/zod/audit-logs'

interface AuditLogActionBadgeProps extends BadgeProps {
  action: AuditLogAction
}

export function AuditLogActionBadge({ action, ...badgeProps }: AuditLogActionBadgeProps) {
  function getActionLabel(action: AuditLogAction) {
    switch (action) {
      case 'create':
        return 'Creación'
      case 'update':
        return 'Actualización'
      case 'delete':
        return 'Eliminación'
      default:
        return action
    }
  }

  function getBadgeVariant() {
    switch (action) {
      case 'create':
        return 'success'
      case 'update':
        return 'info'
      case 'delete':
        return 'destructive'
      default:
        return 'default'
    }
  }

  return (
    <Badge variant={getBadgeVariant()} {...badgeProps}>
      {getActionLabel(action)}
    </Badge>
  )
}
