import type { PostgrestError } from '@supabase/supabase-js'
import { m } from '@/paraglide/messages'

/**
 * Return shape for server actions. Check with `result.error !== undefined`
 * (not truthiness) so TypeScript narrows `data` in the happy path.
 */
export type ActionResult<T = undefined> = { data: T; error?: never } | { data?: never; error: string }

const RLS_VIOLATION = '42501'
// PostgREST: `.single()` found no row. After an UPDATE this means RLS filtered
// it out (Postgres reports 0 rows instead of an error in that case).
const NO_ROWS = 'PGRST116'
export const UNIQUE_VIOLATION = '23505'
export const EXCLUSION_VIOLATION = '23P01'

/**
 * transactions_folio_one_receipt: the receipt book never repeats a folio.
 * Answer it with `m.common_folio_taken()`.
 */
export function isFolioTaken(error: PostgrestError) {
  return error.code === EXCLUSION_VIOLATION && error.message.includes('transactions_folio_one_receipt')
}

interface PostgrestMessageOptions {
  /** Shown for anything not recognised below. */
  fallback: string
  /**
   * Unique-violation messages keyed by constraint/index name. Postgres names
   * it in the message: `duplicate key value violates unique constraint "…"`.
   */
  unique?: Record<string, string>
  /** Unique violation on a constraint not listed in `unique`. */
  uniqueFallback?: string
}

/** Maps a PostgREST error to a user-facing message. */
export function postgrestErrorMessage(
  error: PostgrestError,
  { fallback, unique = {}, uniqueFallback = m.common_unique_fallback() }: PostgrestMessageOptions,
): string {
  switch (error.code) {
    case RLS_VIOLATION:
    case NO_ROWS:
      return m.common_no_permission()
    case UNIQUE_VIOLATION: {
      const constraint = Object.keys(unique).find((name) => error.message.includes(name))
      return constraint ? unique[constraint] : uniqueFallback
    }
    default:
      return fallback
  }
}

// Raised by the pay/reject/reopen request RPCs (Maintenance and Security).
const NOT_FOUND = 'P0002'
const ALREADY_RESOLVED = 'P0003'
export const FK_VIOLATION = '23503'

/** Maps an error from `pay_*_request` / `reject_*_request` / `reopen_*_request` to a user-facing message. */
export function requestResolutionErrorMessage(error: PostgrestError, fallback: string): string {
  if (error.code === ALREADY_RESOLVED && error.message.includes('not rejected')) {
    return m.common_request_already_reopened()
  }
  if (error.code === ALREADY_RESOLVED) return m.common_request_already_resolved()
  if (error.code === NOT_FOUND && error.message.includes('no period')) {
    return m.common_request_no_period()
  }
  if (error.code === NOT_FOUND) return m.common_request_not_found()
  return postgrestErrorMessage(error, { fallback })
}
