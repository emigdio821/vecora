import type { Badge } from '@/components/ui/badge'
import type { RequestStatus } from '@/lib/validations/maintenance'

export const STATUS_LABEL: Record<RequestStatus, string> = {
  pending: 'Pendiente',
  paid: 'Pagada',
  rejected: 'Rechazada',
}

export const STATUS_BADGE_VARIANT: Record<RequestStatus, React.ComponentProps<typeof Badge>['variant']> = {
  pending: 'warning',
  paid: 'success',
  rejected: 'error',
}
