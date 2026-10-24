import { useQuery } from '@tanstack/react-query'
import { addYears, format, parseISO, subYears } from 'date-fns'
import { NoPeriodsEmpty } from '@/components/shared/no-periods-empty'
import { Calendar } from '@/components/ui/calendar'
import { useToday } from '@/hooks/use-today'
import { periodFor } from '@/lib/periods'
import { ISO_DAY } from '@/lib/utils'
import { periodsQueryOptions } from '@/tanstack-queries/presidency'

interface PeriodCalendarProps {
  /** "YYYY-MM-DD" */
  value: string
  onChange: (day: string) => void
}

/**
 * Day picker for the date of a money movement. Every movement is filed under
 * the period that contains its date, so only days inside a period can be
 * picked; the gaps between periods show disabled.
 */
export function PeriodCalendar({ value, onChange }: PeriodCalendarProps) {
  const { data: periods, isPending } = useQuery(periodsQueryOptions)
  const today = useToday()

  if (periods?.length === 0) {
    return <NoPeriodsEmpty />
  }

  // Newest first: navigation runs from the first period's start to the last one's end.
  // Without the list (loading, or it failed) it falls back to a few years around today.
  const first = periods?.at(-1)
  const last = periods?.[0]

  return (
    <Calendar
      mode="single"
      required
      captionLayout="dropdown"
      startMonth={first ? parseISO(first.startsOn) : subYears(today, 5)}
      endMonth={last ? parseISO(last.endsOn) : addYears(today, 1)}
      selected={parseISO(value)}
      defaultMonth={parseISO(value)}
      // Loading: nothing to pick yet. Failed: no limits here, saving still checks.
      disabled={
        isPending ? true : (day) => periods !== undefined && !periodFor(periods, format(day, ISO_DAY))
      }
      onSelect={(day) => {
        onChange(format(day, ISO_DAY))
      }}
    />
  )
}
