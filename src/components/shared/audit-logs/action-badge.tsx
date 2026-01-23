import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { AuditLogAction } from '@/db/schemas/zod/audit-logs'
import { cn } from '@/lib/utils'

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

  return (
    <Badge variant="outline" {...badgeProps}>
      <span
        aria-hidden
        className={cn('size-1.5 rounded-full', {
          'bg-success': action === 'create',
          'bg-info': action === 'update',
          'bg-destructive': action === 'delete',
        })}
      />
      {getActionLabel(action)}
    </Badge>
  )
}
