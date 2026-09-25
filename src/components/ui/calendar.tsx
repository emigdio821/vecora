'use client'

import { DayPicker, type DropdownProps, useDayPicker } from '@daypicker/react'
import type { Month } from 'date-fns'
import { es } from 'date-fns/locale'
import { ChevronLeftIcon, ChevronRightIcon, ChevronsUpDownIcon } from 'lucide-react'
import * as React from 'react'
import {
  Combobox,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxPopup,
} from '@/components/ui/combobox'
import { cn } from '@/lib/utils'

const buttonClassNames =
  "relative flex size-(--cell-size) text-base sm:text-sm items-center justify-center rounded-lg text-foreground not-in-data-selected:hover:bg-accent disabled:pointer-events-none disabled:opacity-64 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0"

interface DropdownItem {
  disabled?: boolean
  label: string
  value: string
}

interface CalendarDropdownProps extends DropdownProps {
  /** Text shown in the input for the selected option; the list keeps `label`. */
  inputLabel?: (value: number) => string
}

/** Month / year selector used when `captionLayout="dropdown"`: a searchable combobox instead of a native <select>. */
function CalendarDropdown({
  options,
  value,
  onChange,
  'aria-label': ariaLabel,
  inputLabel,
}: CalendarDropdownProps) {
  const items: DropdownItem[] =
    options?.map((option) => ({
      disabled: option.disabled,
      label: option.label,
      value: option.value.toString(),
    })) ?? []

  const selectedItem = items.find((item) => item.value === value?.toString())

  return (
    <Combobox
      aria-label={ariaLabel}
      autoHighlight
      items={items}
      value={selectedItem}
      itemToStringLabel={(item) => (item ? (inputLabel?.(Number(item.value)) ?? item.label) : '')}
      onValueChange={(item: DropdownItem | null) => {
        if (!onChange || !item) return
        // DayPicker expects a <select> change event; only `target.value` is read.
        onChange({ target: { value: item.value } } as React.ChangeEvent<HTMLSelectElement>)
      }}
    >
      <ComboboxInput className="**:[input]:w-0 **:[input]:flex-1" onFocus={(e) => e.currentTarget.select()} />
      <ComboboxPopup aria-label={ariaLabel}>
        <ComboboxEmpty>Sin resultados.</ComboboxEmpty>
        <ComboboxList>
          {(item: DropdownItem) => (
            <ComboboxItem key={item.value} value={item} disabled={item.disabled}>
              {item.label}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxPopup>
    </Combobox>
  )
}

/** Full month names in the list ("septiembre"), short in the input ("sep") so month and year fit side by side. */
function CalendarMonthsDropdown(props: DropdownProps) {
  const { dayPickerProps } = useDayPicker()
  const localize = dayPickerProps.locale?.localize

  return (
    <CalendarDropdown
      {...props}
      // Options are always 0–11, which is what date-fns's `Month` union is.
      inputLabel={localize ? (month) => localize.month(month as Month, { width: 'abbreviated' }) : undefined}
    />
  )
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components: userComponents,
  mode = 'single',
  locale = es,
  ...props
}: React.ComponentProps<typeof DayPicker>): React.ReactElement {
  const defaultClassNames = {
    button_next: buttonClassNames,
    button_previous: buttonClassNames,
    caption_label: 'text-base sm:text-sm font-medium flex items-center gap-2 h-full',
    day: 'size-(--cell-size) text-sm py-px',
    day_button: cn(
      buttonClassNames,
      'outline-none focus-visible:z-1 focus-visible:ring-[3px] focus-visible:ring-ring/50 in-data-outside:text-muted-foreground/72 in-data-selected:bg-primary in-data-selected:text-primary-foreground in-data-selected:in-data-outside:text-primary-foreground in-data-disabled:pointer-events-none in-data-disabled:text-muted-foreground/72 in-data-disabled:line-through in-[.range-end:not(.range-start)]:rounded-s-none in-[.range-middle]:rounded-none in-[.range-middle]:in-data-selected:bg-accent in-[.range-middle]:in-data-selected:text-foreground in-[.range-start:not(.range-end)]:rounded-e-none in-[[data-selected]:not(.range-middle)]:transition-[border-radius,box-shadow]',
    ),
    dropdown: 'absolute bg-popover inset-0 opacity-0',
    dropdown_root:
      "relative has-focus:border-ring has-focus:ring-ring/50 has-focus:ring-[3px] border border-input shadow-xs/5 rounded-lg px-[calc(--spacing(3)-1px)] h-9 sm:h-8 [&_svg:not([class*='opacity-'])]:opacity-80 [&_svg:not([class*='size-'])]:size-4.5 sm:[&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:-me-1",
    dropdowns:
      'w-full flex items-center text-base sm:text-sm justify-center h-(--cell-size) gap-1.5 *:[span]:font-medium',
    hidden: 'invisible',
    month: 'w-full',
    month_caption: 'relative mx-(--cell-size) px-1 mb-1 flex h-(--cell-size) items-center justify-center z-2',
    months: 'relative flex flex-col sm:flex-row gap-2',
    nav: 'absolute top-0 flex w-full justify-between z-1',
    outside: 'text-muted-foreground data-selected:bg-accent/50 data-selected:text-muted-foreground',
    range_end: 'range-end',
    range_middle: 'range-middle',
    range_start: 'range-start',
    today:
      '*:after:pointer-events-none *:after:absolute *:after:bottom-1 *:after:start-1/2 *:after:z-1 *:after:size-[3px] *:after:-translate-x-1/2 *:after:rounded-full *:after:bg-primary [&[data-selected]:not(.range-middle)>*]:after:bg-background [&[data-disabled]>*]:after:bg-foreground/30',
    week_number: 'size-(--cell-size) p-0 text-xs font-medium text-muted-foreground/72',
    weekday: 'size-(--cell-size) p-0 text-xs font-medium text-muted-foreground/72',
  }
  const mergedClassNames: typeof defaultClassNames = Object.keys(defaultClassNames).reduce(
    (acc, key) => {
      const userClass = classNames?.[key as keyof typeof classNames]
      const baseClass = defaultClassNames[key as keyof typeof defaultClassNames]

      acc[key as keyof typeof defaultClassNames] = userClass ? cn(baseClass, userClass) : baseClass

      return acc
    },
    { ...defaultClassNames } as typeof defaultClassNames,
  )

  const defaultComponents = {
    Dropdown: CalendarDropdown,
    MonthsDropdown: CalendarMonthsDropdown,
    Chevron: ({
      className,
      orientation,
      ...props
    }: {
      className?: string
      orientation?: 'left' | 'right' | 'up' | 'down'
    }): React.ReactElement => {
      if (orientation === 'left') {
        return <ChevronLeftIcon className={cn(className, 'rtl:rotate-180')} {...props} aria-hidden="true" />
      }

      if (orientation === 'right') {
        return <ChevronRightIcon className={cn(className, 'rtl:rotate-180')} {...props} aria-hidden="true" />
      }

      return <ChevronsUpDownIcon className={className} {...props} aria-hidden="true" />
    },
  }

  const mergedComponents = {
    ...defaultComponents,
    ...userComponents,
  }

  const dayPickerProps = {
    className: cn('w-fit [--cell-size:--spacing(10)] sm:[--cell-size:--spacing(9)]', className),
    classNames: mergedClassNames,
    components: mergedComponents,
    'data-slot': 'calendar',
    locale,
    mode,
    showOutsideDays,
    ...props,
  }

  return <DayPicker {...(dayPickerProps as React.ComponentProps<typeof DayPicker>)} />
}
