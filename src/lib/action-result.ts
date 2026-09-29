import type { PostgrestError } from '@supabase/supabase-js'

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

/** Maps a PostgREST error to a user-facing (Spanish) message. */
export function postgrestErrorMessage(
  error: PostgrestError,
  { fallback, unique = {}, uniqueFallback = 'Ya existe un registro con esos datos' }: PostgrestMessageOptions,
): string {
  switch (error.code) {
    case RLS_VIOLATION:
    case NO_ROWS:
      return 'No tienes permisos para realizar esta acción'
    case UNIQUE_VIOLATION: {
      const constraint = Object.keys(unique).find((name) => error.message.includes(name))
      return constraint ? unique[constraint] : uniqueFallback
    }
    default:
      return fallback
  }
}

// Raised by the pay/reject request RPCs ("Mantenimiento" and "Seguridad").
const NOT_FOUND = 'P0002'
const ALREADY_RESOLVED = 'P0003'
export const FK_VIOLATION = '23503'

/** Maps an error from `pay_*_request` / `reject_*_request` to a user-facing message. */
export function requestResolutionErrorMessage(error: PostgrestError, fallback: string): string {
  if (error.code === ALREADY_RESOLVED) return 'Esta solicitud ya fue resuelta por alguien más'
  if (error.code === NOT_FOUND && error.message.includes('no period')) {
    return 'Ningún periodo cubre esa fecha. Crea el periodo primero.'
  }
  if (error.code === NOT_FOUND) return 'La solicitud ya no existe'
  return postgrestErrorMessage(error, { fallback })
}
