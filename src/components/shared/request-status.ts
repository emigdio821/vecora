import type { Badge } from '@/components/ui/badge'
import type { RequestStatus } from '@/lib/validations/requests'
import { m } from '@/paraglide/messages'

// Shared by the Maintenance and Security payment requests.

export const STATUS_LABEL: Record<RequestStatus, string> = {
  get pending() {
    return m.common_request_status_pending()
  },
  get paid() {
    return m.common_request_status_paid()
  },
  get rejected() {
    return m.common_request_status_rejected()
  },
}

export const STATUS_BADGE_VARIANT: Record<RequestStatus, React.ComponentProps<typeof Badge>['variant']> = {
  pending: 'warning',
  paid: 'success',
  rejected: 'error',
}
