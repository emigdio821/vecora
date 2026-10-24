import { isServiceError, type ServiceErrorCode } from '@/lib/services/errors'
import { m } from '@/paraglide/messages'

/**
 * Return shape for server actions. Check with `result.error !== undefined`
 * (not truthiness) so TypeScript narrows `data` in the happy path.
 */
export type ActionResult<T = undefined> = { data: T; error?: never } | { data?: never; error: string }

export const UNIQUE_VIOLATION = '23505'
export const FK_VIOLATION = '23503'
export const CHECK_VIOLATION = '23514'
export const EXCLUSION_VIOLATION = '23P01'

/** What Postgres raised: its SQLSTATE code, the constraint it names, and its message. */
export interface DatabaseError {
  code: string
  constraint: string
  message: string
}

/**
 * The Postgres error behind a failed Drizzle query. Drizzle wraps it, and
 * node-postgres's error (with the code and the constraint) is the cause.
 * Anything else gets an empty code, so it falls through to the fallback.
 */
export function databaseError(error: unknown): DatabaseError {
  let source = error
  if (error instanceof Error && error.cause !== undefined) {
    source = error.cause
  }
  if (source instanceof Error && 'code' in source && typeof source.code === 'string') {
    let constraint = ''
    if ('constraint' in source && typeof source.constraint === 'string') {
      constraint = source.constraint
    }
    return { code: source.code, constraint, message: source.message }
  }
  return { code: '', constraint: '', message: String(error) }
}

interface ErrorMessages {
  /** Shown for anything not recognised below. */
  fallback: string
  /** Messages for the rules of src/lib/services, by code. Unlisted ones get a general message, or the fallback. */
  service?: Partial<Record<ServiceErrorCode, string>>
  /** Messages for a constraint that refused the write (a unique index, an exclusion, a foreign key), by name. */
  constraints?: Record<string, string>
  /** Unique violation on a constraint not listed in `constraints`. */
  uniqueFallback?: string
}

// What a broken rule says when the section has nothing more specific.
const SERVICE_MESSAGES: Partial<Record<ServiceErrorCode, () => string>> = {
  no_period: m.common_request_no_period,
  already_resolved: m.common_request_already_resolved,
  not_rejected: m.common_request_already_reopened,
  admin_only: m.common_no_permission,
  not_author: m.common_no_permission,
}

/**
 * The message for a failed write: a rule of the services (ServiceError), or
 * a constraint of the database. The paper receipt book's folio has the same
 * message everywhere.
 */
export function errorMessage(error: unknown, messages: ErrorMessages): string {
  if (isServiceError(error)) {
    const specific = messages.service?.[error.code]
    if (specific !== undefined) {
      return specific
    }
    const general = SERVICE_MESSAGES[error.code]
    if (general !== undefined) {
      return general()
    }
    return messages.fallback
  }

  const cause = databaseError(error)
  const byConstraint = messages.constraints?.[cause.constraint]
  if (byConstraint !== undefined) {
    return byConstraint
  }
  if (cause.constraint === 'transactions_folio_one_receipt') {
    return m.common_folio_taken()
  }
  if (cause.code === UNIQUE_VIOLATION) {
    return messages.uniqueFallback ?? m.common_unique_fallback()
  }
  return messages.fallback
}

/** Whether a write was refused by a unique index or an exclusion constraint (restoring a row whose number, email or folio was used again). */
export function isTaken(error: unknown): boolean {
  const { code } = databaseError(error)
  return code === UNIQUE_VIOLATION || code === EXCLUSION_VIOLATION
}
