import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { ViolationStatus } from '@/db/schema/zod/violations'

interface ViolationStatusBadgeProps extends BadgeProps {
  status: ViolationStatus
}

export function ViolationStatusBadge({ status, ...badgeProps }: ViolationStatusBadgeProps) {
  function getStatusLabel() {
    switch (status) {
      case 'paid':
        return 'Pagado'
      case 'pending':
        return 'Pendiente'
      default:
        return status
    }
  }

  function getBadgeVariant() {
    switch (status) {
      case 'paid':
        return 'success'
      case 'pending':
        return 'warning'
      default:
        return 'default'
    }
  }

  return (
    <Badge variant={getBadgeVariant()} {...badgeProps}>
      {getStatusLabel()}
    </Badge>
  )
}
