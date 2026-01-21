import { IconSelector } from '@tabler/icons-react'
import type { DayPickerProps } from 'react-day-picker'
import { formatDate } from '@/lib/utils'
import { Button, type ButtonProps } from '../ui/button'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverPopup, PopoverTrigger } from '../ui/popover'

type DateSelectorProps = DayPickerProps & {
  value?: Date
  triggerProps?: ButtonProps
}

// TODO: Improve multiple, range selection modes

export function DateSelector(props: DateSelectorProps) {
  const { triggerProps, id, value = new Date(), ...calendarProps } = props

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            className="w-full justify-between data-[invalid=true]:border-destructive/36"
            {...triggerProps}
          >
            <span className="font-normal">{formatDate(value)}</span>
            <IconSelector className="-me-1!" />
          </Button>
        }
      />
      <PopoverPopup className="p-0">
        <Calendar id={id} {...calendarProps} />
      </PopoverPopup>
    </Popover>
  )
}
