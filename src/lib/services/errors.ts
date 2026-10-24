// The rules of each section live in src/lib/services. A broken rule throws a
// ServiceError with one of these codes; the server function turns it into a
// message for the screen (errorMessage in src/lib/action-result.ts). The seed
// and the scripts call the same services, so they can't skip a rule either.

export const SERVICE_ERROR_CODES = [
  /** What the request points at is gone (or never existed). */
  'not_found',
  /** No period covers the day of a movement. */
  'no_period',
  /** A transfer without its reference. */
  'transfer_needs_reference',
  /** A request already paid or rejected; a booking already paid. */
  'already_resolved',
  /** Reopening a request that isn't rejected. */
  'not_rejected',
  /** A rejection without its reason. */
  'rejection_needs_reason',
  /** Paying a free booking. */
  'reservation_free',
  /** Editing, deleting or paying a cancelled booking. */
  'reservation_cancelled',
  /** Deleting a paid booking, or changing its area, house or amount: cancel it instead. */
  'reservation_paid',
  /** Refunding more than was paid. */
  'refund_too_large',
  /** The category doesn't exist or is of the other kind. */
  'category_kind',
  /** Typing a row of a system category (fees, bookings) into the ledger by hand. */
  'system_category',
  /** Another account already signs in with that email. */
  'email_taken',
  /** The main admin keeps its role, its name and its email. */
  'main_admin_protected',
  /** Handing out, taking away or linking for the admin role, without being an admin. */
  'admin_only',
  /** Changing one's own roles, or taking oneself off the board. */
  'self_change',
  /** Seating a resident who has no email. */
  'resident_no_email',
  /** Seating a resident who is already on the board. */
  'already_member',
  /** Writing a template someone else saved, without being an admin. */
  'not_author',
] as const

export type ServiceErrorCode = (typeof SERVICE_ERROR_CODES)[number]

export class ServiceError extends Error {
  readonly code: ServiceErrorCode
  /** What it was about (a day, a status, a category key), for the logs and some messages. */
  readonly detail: string | undefined

  constructor(code: ServiceErrorCode, detail?: string) {
    super(detail ? `${code}: ${detail}` : code)
    this.name = 'ServiceError'
    this.code = code
    this.detail = detail
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError
}
