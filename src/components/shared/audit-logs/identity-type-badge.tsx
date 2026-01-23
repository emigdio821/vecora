import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { AuditLogEntityType } from '@/db/schemas/zod/audit-logs'

interface AuditLogEntityTypeBadgeProps extends BadgeProps {
  entityType: AuditLogEntityType
}

export function AuditLogEntityTypeBadge({ entityType, ...badgeProps }: AuditLogEntityTypeBadgeProps) {
  function getTypeLabel(type: AuditLogEntityType) {
    switch (type) {
      case 'owner':
        return 'Propietario'
      case 'house':
        return 'Casa'
      case 'violation':
        return 'Infracción'
      case 'external_user':
        return 'Usuario Externo'
      case 'payment':
        return 'Pago'
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
