import { format, subDays } from 'date-fns'
import { parseAsString, parseAsStringLiteral, useQueryState } from 'nuqs'
import { ISO_DAY } from '@/lib/utils'
import type { LogsRange } from '@/tanstack-queries/logs'
import { ACTIONS, SECTIONS } from '../entry'

/*
 * URL-backed filters, shared by the header (controls) and the table (data).
 * The date range narrows the query; the rest narrow the rows client-side.
 */

const DEFAULT_RANGE_DAYS = 30

export function defaultRange(): LogsRange {
  const today = new Date()
  return { from: format(subDays(today, DEFAULT_RANGE_DAYS - 1), ISO_DAY), to: format(today, ISO_DAY) }
}

export function useRangeFilter() {
  const initial = defaultRange()
  const [from, setFrom] = useQueryState('from', parseAsString.withDefault(initial.from))
  const [to, setTo] = useQueryState('to', parseAsString.withDefault(initial.to))

  const range: LogsRange = { from, to }
  const setRange = (next: LogsRange) => {
    void setFrom(next.from)
    void setTo(next.to)
  }
  return [range, setRange] as const
}

export const SECTION_FILTERS = ['all', ...SECTIONS] as const
export type SectionFilter = (typeof SECTION_FILTERS)[number]

export function useSectionFilter() {
  return useQueryState('section', parseAsStringLiteral(SECTION_FILTERS).withDefault('all'))
}

export const ACTION_FILTERS = ['all', ...ACTIONS] as const
export type ActionFilter = (typeof ACTION_FILTERS)[number]

export function useActionFilter() {
  return useQueryState('action', parseAsStringLiteral(ACTION_FILTERS).withDefault('all'))
}

/** Identity is filtered by display name; 'all' means everyone. */
export function useIdentityFilter() {
  return useQueryState('identity', parseAsString.withDefault('all'))
}
