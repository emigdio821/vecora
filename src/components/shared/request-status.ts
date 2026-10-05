import type { Badge } from '@/components/ui/badge'
import type { RequestStatus } from '@/lib/validations/requests'

// Shared by the Maintenance and Security payment requests.

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
