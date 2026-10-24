import { addDays, eachMonthOfInterval, format, parseISO, subDays } from 'date-fns'
import { ISO_DAY } from '@/lib/utils'

/** What these helpers read; any row of the periods query has it. Dates are "YYYY-MM-DD". */
interface PeriodDates {
  id: string
  name: string
  startsOn: string
  endsOn: string
}

/** The period `day` falls in. Periods never overlap, so there is at most one. */
export function periodFor<T extends PeriodDates>(periods: T[], day: string) {
  return periods.find((period) => period.startsOn <= day && day <= period.endsOn)
}

/** Whether a period covers at least one day from `from` to `to`, both included. */
export function overlapsPeriod(periods: PeriodDates[], from: string, to: string): boolean {
  return periods.some((period) => period.startsOn <= to && from <= period.endsOn)
}

/**
 * Months ("YYYY-MM-01") a period touches, up to `today`'s month, newest first.
 * Every movement belongs to a period, so a month outside them all has nothing
 * to report; gaps between periods are left out. Reports never look past today.
 */
export function reportableMonths(periods: PeriodDates[], today: string): string[] {
  const months = new Set<string>()
  for (const period of periods) {
    if (period.startsOn > today) continue
    const end = period.endsOn < today ? period.endsOn : today
    for (const month of eachMonthOfInterval({ start: parseISO(period.startsOn), end: parseISO(end) })) {
      months.add(format(month, ISO_DAY))
    }
  }
  return [...months].sort((a, b) => b.localeCompare(a))
}

/** Fee months ("YYYY-MM-01") as combobox groups, one per period, in the periods' order. */
export interface FeeMonthGroup {
  /** The period's name. */
  value: string
  items: string[]
}

/**
 * Every month a period touches. A month shared by two periods (one ends and the
 * next starts mid-month) is listed once, under the first of them.
 */
export function feeMonthsByPeriod(periods: PeriodDates[]): FeeMonthGroup[] {
  const listed = new Set<string>()
  const groups: FeeMonthGroup[] = []

  for (const period of periods) {
    const months = eachMonthOfInterval({ start: parseISO(period.startsOn), end: parseISO(period.endsOn) })
      .map((month) => format(month, ISO_DAY))
      .filter((month) => !listed.has(month))
    for (const month of months) listed.add(month)
    if (months.length > 0) groups.push({ value: period.name, items: months })
  }

  return groups
}

/** Days no period covers, between `period` and its neighbour. */
export interface PeriodGap {
  from: string
  to: string
  /** The neighbouring period's name. */
  neighbour: string
}

/**
 * The uncovered days right before and right after `startsOn`–`endsOn`, if any.
 * `excludeId` leaves out the period being edited. Nothing when the dates
 * overlap another period: saving fails on that first.
 */
export function adjacentGaps(
  periods: PeriodDates[],
  startsOn: string,
  endsOn: string,
  excludeId?: string,
): { before?: PeriodGap; after?: PeriodGap } {
  const others = periods.filter((period) => period.id !== excludeId)
  if (others.some((period) => period.startsOn <= endsOn && startsOn <= period.endsOn)) return {}

  const previous = others
    .filter((period) => period.endsOn < startsOn)
    .reduce<PeriodDates | undefined>(
      (latest, period) => (latest === undefined || period.endsOn > latest.endsOn ? period : latest),
      undefined,
    )
  const next = others
    .filter((period) => period.startsOn > endsOn)
    .reduce<PeriodDates | undefined>(
      (earliest, period) =>
        earliest === undefined || period.startsOn < earliest.startsOn ? period : earliest,
      undefined,
    )

  const gaps: { before?: PeriodGap; after?: PeriodGap } = {}
  if (previous) {
    const from = format(addDays(parseISO(previous.endsOn), 1), ISO_DAY)
    if (from < startsOn) {
      gaps.before = { from, to: format(subDays(parseISO(startsOn), 1), ISO_DAY), neighbour: previous.name }
    }
  }
  if (next) {
    const from = format(addDays(parseISO(endsOn), 1), ISO_DAY)
    if (from < next.startsOn) {
      gaps.after = { from, to: format(subDays(parseISO(next.startsOn), 1), ISO_DAY), neighbour: next.name }
    }
  }
  return gaps
}
