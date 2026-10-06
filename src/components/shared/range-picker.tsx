import type { DateRange } from '@daypicker/react'
import { IconCalendar } from '@tabler/icons-react'
import {
  endOfMonth,
  format,
  isBefore,
  parseISO,
  startOfMonth,
  startOfYear,
  subDays,
  subYears,
} from 'date-fns'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverPopup, PopoverTrigger } from '@/components/ui/popover'
import { useToday } from '@/hooks/use-today'
import { cn, formatDay, ISO_DAY } from '@/lib/utils'
import { m } from '@/paraglide/messages'

export interface DayRange {
  /** ISO day, inclusive. */
  from: string
  /** ISO day, inclusive. */
  to: string
}

export interface RangePreset {
  label: string
  range: (today: Date) => DayRange
}

interface RangePickerProps {
  value: DayRange
  onChange: (range: DayRange) => void
  presets?: RangePreset[]
  /** For the trigger button, e.g. "w-full" to line up with other fields. */
  className?: string
}

export function toRange(from: Date, to: Date): DayRange {
  return { from: format(from, ISO_DAY), to: format(to, ISO_DAY) }
}

const DEFAULT_PRESETS: RangePreset[] = [
  {
    get label() {
      return m.common_today()
    },
    range: (today) => toRange(today, today),
  },
  {
    get label() {
      return m.common_range_last_7_days()
    },
    range: (today) => toRange(subDays(today, 6), today),
  },
  {
    get label() {
      return m.common_range_last_30_days()
    },
    range: (today) => toRange(subDays(today, 29), today),
  },
  {
    get label() {
      return m.common_range_this_month()
    },
    range: (today) => toRange(startOfMonth(today), endOfMonth(today)),
  },
  {
    get label() {
      return m.common_range_this_year()
    },
    range: (today) => toRange(startOfYear(today), today),
  },
]

/**
 * Which days to show. The first click starts a new range and the second one
 * finishes it, in either order; only then does `onChange` fire.
 */
export function RangePicker({ value, onChange, presets = DEFAULT_PRESETS, className }: RangePickerProps) {
  const today = useToday()
  const [isOpen, setOpen] = useState(false)
  const [month, setMonth] = useState(() => parseISO(value.from))
  /** The start of a range being picked; the current range shows until then. */
  const [draftFrom, setDraftFrom] = useState<Date | undefined>()

  const selected: DateRange = draftFrom
    ? { from: draftFrom, to: undefined }
    : { from: parseISO(value.from), to: parseISO(value.to) }
  const label =
    value.from === value.to ? formatDay(value.from) : `${formatDay(value.from)} – ${formatDay(value.to)}`

  function commit(range: DayRange) {
    onChange(range)
    setMonth(parseISO(range.from))
    setDraftFrom(undefined)
    setOpen(false)
  }

  return (
    <Popover
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen)
        if (!nextOpen) setDraftFrom(undefined)
      }}
    >
      <PopoverTrigger
        render={<Button variant="outline" className={cn('justify-start font-normal', className)} />}
      >
        <IconCalendar aria-hidden="true" />
        {label}
      </PopoverTrigger>
      <PopoverPopup>
        <div className="flex max-sm:flex-col">
          <div className="relative py-1 ps-1 max-sm:order-1 max-sm:border-t">
            <div className="flex h-full flex-col sm:border-e sm:pe-3">
              {presets.map((preset) => (
                <Button
                  key={preset.label}
                  size="sm"
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => {
                    commit(preset.range(today))
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <Calendar
            className="max-sm:pb-3 sm:ps-2"
            mode="range"
            captionLayout="dropdown"
            startMonth={subYears(today, 5)}
            endMonth={today}
            month={month}
            onMonthChange={setMonth}
            disabled={{ after: today }}
            selected={selected}
            // The library's own range logic would extend or shrink the range
            // already shown; we only care about which day was clicked.
            onSelect={(_range, day) => {
              if (!draftFrom) {
                setDraftFrom(day)
                return
              }
              commit(isBefore(day, draftFrom) ? toRange(day, draftFrom) : toRange(draftFrom, day))
            }}
          />
        </div>
      </PopoverPopup>
    </Popover>
  )
}
