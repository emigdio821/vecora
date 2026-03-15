import { Badge, type BadgeProps } from '@/components/ui/badge'
import type { PaymentStatus } from '@/db/schema/zod/payments'
import { getPaymentStatusLabel } from '@/lib/utils'

interface AuditLogActionBadgeProps extends BadgeProps {
  status: PaymentStatus
}

export function PaymentStatusBadge({ status, ...badgeProps }: AuditLogActionBadgeProps) {
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
      {getPaymentStatusLabel(status)}
    </Badge>
  )
}
