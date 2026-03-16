import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { AuditLogEntityType } from '@/db/schema/zod/audit-logs'

interface AuditLogEntityTypeBadgeProps extends BadgeProps {
  entityType: AuditLogEntityType
}

export function AuditLogEntityTypeBadge({ entityType, ...badgeProps }: AuditLogEntityTypeBadgeProps) {
  function getTypeLabel(type: AuditLogEntityType) {
    switch (type) {
      case 'resident':
        return 'Residente'
      case 'house':
        return 'Casa'
      case 'violation':
        return 'Infracción'
      case 'payment':
        return 'Pago'
      case 'profile':
        return 'Perfil'
      case 'hoa_board':
        return 'Mesa directiva'
      case 'hoa_board_period':
        return 'Período de mesa directiva'
      case 'user':
        return 'Usuario'
      case 'notification':
        return 'Notificación'
      default:
        return type
    }
  }

  return (
    <Badge variant="outline" {...badgeProps}>
      {getTypeLabel(entityType)}
    </Badge>
  )
}
