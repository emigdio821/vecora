import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { PaymentStatus } from '@/db/schemas/zod/payments'

interface AuditLogActionBadgeProps extends BadgeProps {
  status: PaymentStatus
}

export function PaymentStatusBadge({ status, ...badgeProps }: AuditLogActionBadgeProps) {
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
