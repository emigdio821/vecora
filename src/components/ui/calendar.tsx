import { IconChevronLeft, IconChevronRight, IconChevronUp } from '@tabler/icons-react'
import { DayPicker, type DayPickerProps, getDefaultClassNames } from 'react-day-picker'
import { cn, formatDate } from '@/lib/utils'
import { buttonVariants } from './button'
import { NativeSelect, NativeSelectOption } from './native-select'

function Calendar({
  className,
  classNames,
  formatters,
  showOutsideDays = true,
  captionLayout = 'dropdown',
  components: userComponents,
  ...props
}: DayPickerProps) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      captionLayout={captionLayout}
      showOutsideDays={showOutsideDays}
      formatters={{
        formatMonthDropdown: (date) => formatDate(date, { month: 'short', day: undefined, year: undefined }),
        ...formatters,
      }}
      className={cn(
        'group/calendar p-1 [--cell-radius:var(--radius-sm)] [--cell-size:--spacing(9)] sm:[--cell-size:--spacing(8)]',
        className,
      )}
      classNames={{
        root: cn('w-fit', defaultClassNames.root),
        button_next: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'rounded-(--cell-radius) text-muted-foreground/80 hover:text-foreground',
          defaultClassNames.button_next,
        ),
        button_previous: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'rounded-(--cell-radius) text-muted-foreground/80 hover:text-foreground',
          defaultClassNames.button_previous,
        ),
        caption_label: cn(
          'select-none font-medium',
          captionLayout === 'label'
            ? 'text-sm'
            : 'flex items-center gap-1 rounded-(--cell-radius) text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground',
          defaultClassNames.caption_label,
        ),
        day: cn(
          'group/day relative aspect-square size-9 h-full w-full select-none rounded-(--cell-radius) px-0 py-px text-center sm:size-8',
          defaultClassNames.day,
        ),
        day_button: cn(
          buttonVariants({ variant: 'ghost', size: 'icon' }),
          'rounded-(--cell-radius) group-data-selected/day:bg-primary group-data-today/day:font-semibold group-data-selected/day:text-primary-foreground group-data-selected/day:[:hover,[data-pressed]]:bg-primary/90',
          'group-[.range-middle]/day:rounded-none group-[.range-end:not(.range-start)]/day:rounded-s-none group-[.range-start:not(.range-end)]/day:rounded-e-none group-data-selected/day:group-data-outside/day:text-primary-foreground group-data-selected/day:bg-primary group-data-outside/day:text-muted-foreground/72 group-data-selected/day:text-primary-foreground group-data-disabled/day:line-through group-[.range-middle]/day:group-data-selected/day:bg-accent group-[.range-middle]/day:group-data-selected/day:text-foreground group-data-select/day:hover:bg-accent group-[.range-middle]/day:group-data-selected/day:hover:bg-accent/72',
          defaultClassNames.day_button,
        ),
        hidden: cn('invisible', defaultClassNames.hidden),
        months: cn('relative flex flex-col gap-2 md:flex-row', defaultClassNames.months),
        month: cn('flex w-full flex-col gap-2', defaultClassNames.month),
        nav: cn(
          'absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1',
          defaultClassNames.nav,
        ),
        month_caption: cn(
          'flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)',
          defaultClassNames.month_caption,
        ),
        outside: cn('text-muted-foreground aria-selected:text-muted-foreground', defaultClassNames.outside),
        range_end: cn('range-end', defaultClassNames.range_end),
        range_middle: cn('range-middle', defaultClassNames.range_middle),
        range_start: cn('range-start', defaultClassNames.range_start),
        today: cn('[&>button]:bg-accent', defaultClassNames.today),
        week_number: cn(
          'size-9 font-medium text-muted-foreground/72 text-xs sm:size-8',
          defaultClassNames.week_number,
        ),
        weekday: cn(
          'size-9 font-medium text-muted-foreground/72 text-xs sm:size-8',
          defaultClassNames.week_number,
        ),
        dropdowns: cn(
          'flex h-(--cell-size) w-full items-center justify-center gap-1 px-1 font-medium text-sm',
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn('relative rounded-(--cell-radius)', defaultClassNames.dropdown_root),
        dropdown: cn('absolute inset-0 bg-popover opacity-0', defaultClassNames.dropdown),
      }}
      components={{
        Root: ({ className, rootRef, ...props }) => {
          return <div data-slot="calendar" ref={rootRef} className={cn(className)} {...props} />
        },
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === 'left') {
            return <IconChevronLeft className={cn('size-4', className)} {...props} />
          } else if (orientation === 'right') {
            return <IconChevronRight className={cn('size-4', className)} {...props} />
          }

          return (
            <IconChevronUp
              className={cn('size-4', orientation === 'down' && 'rotate-180', className)}
              {...props}
            />
          )
        },
        Dropdown: ({ options, className, name, value, onChange, classNames: _deprecated, ...props }) => {
          return (
            <NativeSelect
              value={value}
              triggerSize="sm"
              onChange={onChange}
              name={name || 'calendar-dropdown'}
              className={cn('min-w-10', className)}
              {...props}
            >
              {options?.map(({ disabled, value, label }) => (
                <NativeSelectOption key={`${label}-${value}`} disabled={disabled} value={value}>
                  {label}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )
        },
      }}
      {...props}
    />
  )
}

export { Calendar }
