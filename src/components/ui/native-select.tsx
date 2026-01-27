import { IconSelector } from '@tabler/icons-react'
import type * as React from 'react'
import { cn } from '@/lib/utils'
import { buttonVariants } from './button'

type NativeSelectProps = React.ComponentProps<'select'> & {
  triggerSize?: 'sm' | 'default'
}

function NativeSelect({ className, triggerSize = 'default', ...props }: NativeSelectProps) {
  return (
    <div
      className={cn('group/native-select relative w-fit has-[select:disabled]:opacity-50', className)}
      data-slot="native-select-wrapper"
      data-size={triggerSize}
    >
      <select
        data-slot="native-select"
        data-size={triggerSize}
        className={cn(
          buttonVariants({ variant: 'outline', size: triggerSize }),
          'scheme-light dark:scheme-dark select-none appearance-none whitespace-normal bg-popover! pr-6 text-popover-foreground',
        )}
        {...props}
      />
      <IconSelector
        className="pointer-events-none absolute top-1/2 right-2 -me-1 size-4 -translate-y-1/2 select-none text-muted-foreground opacity-80 sm:size-4"
        aria-hidden="true"
        data-slot="native-select-icon"
      />
    </div>
  )
}

function NativeSelectOption({ ...props }: React.ComponentProps<'option'>) {
  return <option data-slot="native-select-option" {...props} />
}

function NativeSelectOptGroup({ ...props }: React.ComponentProps<'optgroup'>) {
  return <optgroup data-slot="native-select-optgroup" {...props} />
}

export { NativeSelect, NativeSelectOptGroup, NativeSelectOption }
